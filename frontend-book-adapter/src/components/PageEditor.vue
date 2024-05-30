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
    new Promise(resolve => setTimeout(resolve, 200)).then(() => isLoadingText = false)
  
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

<template>
  <div id="page-editor">
    <div id="toolbar">
      <select v-model="currentBookName" class="item">
        <option v-for="bookName in booksNames" :key="bookName" :value="bookName">{{ bookName }}</option>
      </select>
      <button @click="saveText" :disabled="!isTextUpdated" class="item">🖫</button>
    </div>
    <div id="editor">
      <div id="image-viewer">
        <img v-if="currentItem" :src="`http://localhost:3000/api/getBookImage/${currentBookName}/${currentItem.name}.png`" alt="Image not found" />
      </div>
      <div id="text-editor">
        <textarea v-model="currentText" name="text-editor" id="text-editor" cols="30" rows="10"></textarea>
      </div>
    </div>
    <div id="navigator-bar">
      <div id="left-nav">
        <button @click="prevInfo">←</button>
      </div>
      <div id="page-name">
        <div>
          <span v-if="currentItem">{{ currentItem.name }}</span>
        
        </div>
        <div>
          <span v-if="currentItem">{{ currentItem.index }} / {{ metaInfos.length }}</span>
          
        </div>
      </div>
      <div id="right-nav">
        <button @click="nextInfo">→</button>
      </div>
    </div>

    <div v-if="isLoading" class="loader-overlay">
      <div class="loader">Loading...</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#page-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: white;
  color: black;
  overflow: hidden;

  #toolbar {
    display: flex;
    align-items: center;
    width: 100%;
    height: 5%;
    padding: 0 10px;

    .item {
      margin: 0 10px;
    }
  }

  #editor {
    display: flex;
    width: 100%;
    height: 85%;
    overflow: hidden;

    #image-viewer {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 55%;
      height: 100%;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    #text-editor {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 45%;
      height: 100%;

      textarea {
        width: 100%;
        height: 99%;
      }
    }
  }

  #navigator-bar {
    display: flex;
    width: 100%;
    height: 10%;

    #left-nav,
    #right-nav,
    #page-name {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    #left-nav {
      flex-grow: 1;
    }

    #right-nav {
      flex-grow: 1;
    }

    #page-name {
      flex-grow: 8;
      display: flex;
      flex-direction: column;
    }
  }

  .loader-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .loader {
    border: 16px solid #f3f3f3;
    border-top: 16px solid #3498db;
    border-radius: 50%;
    width: 120px;
    height: 120px;
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
