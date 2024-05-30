<template>
  <div id="page-editor" class="min-h-[calc(100vh-66px)] bg-gray-100 p-4 flex flex-col">
    <div class="bg-white shadow-md rounded-lg p-6 flex flex-col flex-grow w-full overflow-hidden mb-2">
      <div id="toolbar" class="flex items-center space-x-4 mb-4 w-full">
        <select v-model="currentBookName" class="p-2 border border-gray-300 rounded flex-grow">
          <option v-for="bookName in booksNames" :key="bookName" :value="bookName">{{ bookName }}</option>
        </select>
        <button @click="saveText" :disabled="!isTextUpdated" class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">🖫 Save</button>
      </div>
      <div id="editor" class="flex-grow flex space-x-4 w-full overflow-hidden">
        <div id="image-viewer" class="flex-1 bg-gray-200 rounded-lg overflow-auto">
          <img v-if="currentItem" :src="`http://localhost:3000/api/getBookImage/${currentBookName}/${currentItem.name}.png`" alt="Image not found" class="w-full h-auto" />
        </div>
        <div id="text-editor" class="flex-1 overflow-auto">
          <textarea v-model="currentText" name="text-editor" id="text-editor" cols="30" rows="10" class="w-full h-full p-2 border border-gray-300 rounded"></textarea>
        </div>
      </div>
      <div id="navigator-bar" class="flex items-center justify-between mt-4 w-full">
        <button @click="prevInfo" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">← Prev</button>
        <div id="page-name" class="text-center flex-grow">
          <div>
            <span v-if="currentItem" class="font-semibold">{{ currentItem.name }}</span>
          </div>
          <div>
            <span v-if="currentItem">{{ currentItem.index }} / {{ metaInfos.length }}</span>
          </div>
        </div>
        <button @click="nextInfo" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">Next →</button>
      </div>
    </div>
  
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'

interface MetaInfo {
  name: string;
  index: number;
}

const metaInfos = ref<MetaInfo[]>([])
const currentIndex = ref<number>(1)
const currentText = ref<string>('')
const isLoading = ref<boolean>(false)  
const booksNames = ref<string[]>([])
const currentBookName = ref<string>('')
const isTextUpdated = ref<boolean>(false)
let isLoadingText = false; 

const fetchMetasInfos = async (newBookName: string) => {
  try {
    isLoading.value = true  
    const response = await axios.get(`http://localhost:3000/api/getBookMetaInfos?bookName=${newBookName}`)
    metaInfos.value = response.data
    if (metaInfos.value.length > 0) {
      await getTextOfImage(metaInfos.value[0].name)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des metaInfos:', error)
  } finally {
    isLoading.value = false 
  }
}

const getTextOfImage = async (imageName: string) => {
  try {
    let bookName = currentBookName.value
    isLoading.value = true  
    isLoadingText = true; 
    let request = `http://localhost:3000/api/getTextOfImage?bookName=${bookName}&imageName=${imageName}`
    const response = await axios.get(request)
    currentText.value = response.data.text
    isTextUpdated.value = false
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image et du texte:', error)
  } finally {
    isLoading.value = false
    new Promise(resolve => setTimeout(resolve, 1000)).then(() => isLoadingText = false);
 
  }
}

const fetchBooksNames = async () => {
  try {
    isLoading.value = true  
    const response = await axios.get('http://localhost:3000/api/getBooksNames')
    booksNames.value = response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des noms des livres:', error)
  } finally {
    isLoading.value = false 
  }
}

const saveText = async () => {
  if (!currentItem.value) return
  try {
    isLoading.value = true  
    await axios.post('http://localhost:3000/api/updateTextOfPage', {
      bookName: currentBookName.value,
      imageName: currentItem.value.name,
      newText: currentText.value
    })
    isTextUpdated.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du texte:', error)
  } finally {
    isLoading.value = false 
  }
}

onMounted(() => {
  isTextUpdated.value = false
  fetchBooksNames()
})

watch(currentIndex, (newIndex) => {
  const metaInfo = metaInfos.value[newIndex - 1]
  if (metaInfo) {
    getTextOfImage(metaInfo.name)
  }
})

watch(currentBookName, (newBookName) => {
  fetchMetasInfos(newBookName)
})


watch(currentText, (newText, oldText) => {
  if (!isLoadingText && newText !== oldText) {
    isTextUpdated.value = true
  }
})

const currentItem = computed(() => metaInfos.value[currentIndex.value - 1])

const prevInfo = () => {
  if (currentIndex.value > 1) {
    currentIndex.value--
  }
}

const nextInfo = () => {
  if (currentIndex.value < metaInfos.value.length) {
    currentIndex.value++
  }
}
</script>

<style scoped>
.loader {
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

#toolbar {
  height: 5%;
}

#editor {
  height: 90%;
}

#navigator-bar {
  height: 5%;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
