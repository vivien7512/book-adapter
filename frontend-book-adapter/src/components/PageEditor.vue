<template>
  <div id="page-editor" class="min-h-[calc(100vh-66px)] bg-gray-100 p-4 flex flex-col">
    <div class="bg-white shadow-md rounded-lg p-6 flex flex-col flex-grow w-full overflow-hidden mb-2">
      <div id="toolbar" class="flex items-center space-x-4 mb-4 w-full">
        <select v-model="currentBookName" class="p-2 border border-gray-300 rounded flex-grow">
          <option v-for="bookName in booksNames" :key="bookName" :value="bookName">{{ bookName }}</option>
        </select>

        <div id="display-group-btn">
          <div id="button-left" class="bg-blue-500 text-white px-4 py-2 " :class="{ 'active': displayMode === displayModeEnum.SplitImageAndEdition }"
            v-on:click="updateDisplayMode(displayModeEnum.SplitImageAndEdition) ">🖼️|✏️</div>
          <div id="button-middle" class="bg-blue-500 text-white px-4 py-2 " :class="{ 'active': displayMode === displayModeEnum.SplitTextAndEdition }"
            v-on:click="updateDisplayMode(displayModeEnum.SplitTextAndEdition)">📄|✏️</div>
          <div id="button-middle" class="bg-blue-500 text-white px-4 py-2 " :class="{ 'active': displayMode === displayModeEnum.OnlyEdition }"
            v-on:click="updateDisplayMode(displayModeEnum.OnlyEdition)">✏️</div>
          <div id="button-right" class="bg-blue-500 text-white px-4 py-2 " :class="{ 'active': displayMode === displayModeEnum.OnlyImage }"
            v-on:click="updateDisplayMode(displayModeEnum.OnlyImage)">🖼️</div>
        </div>

        <button @click="cancelTextUpdate" :disabled="!isTextUpdated"
          class="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50">🗙 Cancel</button>
        <button @click="saveTextUpdate" :disabled="!isTextUpdated"
          class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">🖫 Save</button>
      </div>

      <div id="editor" class="flex-grow flex space-x-4 w-full overflow-hidden">
        <!-- Image Viewer -->
        <div v-if="showImageViewer" id="image-viewer" class="flex-1 bg-gray-200 rounded-lg overflow-auto">
          <img v-if="currentItem"
            :src="`http://localhost:3000/api/getBookImage/${currentBookName}/${currentItem.name}.png`"
            alt="Image not found" class="w-full h-auto" />
        </div>

        <!-- Text Viewer -->
        <div v-if="displayMode === displayModeEnum.SplitTextAndEdition" id="text-viewer" class="flex-1 overflow-hidden">
          <div class="relative w-full h-full">
            <textarea v-model="currentText" readonly name="text-viewer" id="text-viewer" cols="30" rows="10"
              class="w-full h-full p-2 border border-gray-300 rounded bg-gray-100"></textarea>
            <div class="absolute top-2 right-2 bg-gray-200 text-gray-700 px-2 py-1 text-xs rounded">Saved text</div>
          </div>
        </div>

        <!-- Text Editor -->
        <div v-if="showTextEditor" id="text-editor" class="flex-1 overflow-hidden">
          <textarea v-model="currentText" name="text-editor" id="text-editor" cols="30" rows="10"
            class="w-full h-full p-2 border border-gray-300 rounded"></textarea>
        </div>
      </div>

      <div id="navigator-bar" class="flex items-center justify-between mt-4 w-full">
        <button @click="prevInfo" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">← Prev</button>
        <div id="page-name" class="text-center flex-grow">
          <div>
            <span v-if="currentItem" class="font-semibold">{{ currentItem.name }}</span>
          </div>
          <div>
            <span v-if="currentItem">{{ currentItem.index }} / {{ pageInfos.length }}</span>
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
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import axios from 'axios'

interface PageInfos {
  name: string;
  index: number;
}

const pageInfos = ref<PageInfos[]>([])
const currentIndex = ref<number>(1)
const currentText = ref<string>('')
const isLoading = ref<boolean>(false)
const booksNames = ref<string[]>([])
const currentBookName = ref<string>('')
const isTextUpdated = ref<boolean>(false)
const initialText = ref<string>('')
let isLoadingText = false
const displayModeEnum = {
  OnlyEdition: 'OnlyEdition',
  OnlyImage: 'OnlyImage',
  SplitImageAndEdition: 'SplitImageAndEdition',
  SplitTextAndEdition: 'SplitTextAndEdition'
}

type DisplayMode = keyof typeof displayModeEnum;

const displayMode = ref(displayModeEnum.SplitImageAndEdition);

const fetchMetasInfos = async (newBookName: string) => {
  try {
    isLoading.value = true
    const response = await axios.get(`http://localhost:3000/api/getBookPagesInfos?bookName=${newBookName}`)
    pageInfos.value = response.data
    if (pageInfos.value.length > 0) {
      await getTextOfImage(pageInfos.value[0].name)
    }
  } catch (error) {
    console.error('Error while gathering pageInfos:', error)
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
    initialText.value = response.data.text
    isTextUpdated.value = false
  } catch (error) {
    console.error('Error while gathering text of the image:', error)
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
    console.error('Error while gathering name of books:', error)
  } finally {
    isLoading.value = false
  }
}

const saveTextUpdate = async () => {
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
    console.error('Erreur while saving text:', error)
  } finally {
    isLoading.value = false
  }
}

const cancelTextUpdate = async () => {
  currentText.value = initialText.value
  await nextTick()
  isTextUpdated.value = false
}

onMounted(() => {
  isTextUpdated.value = false
  fetchBooksNames()
})

watch(currentIndex, (newIndex: number) => {
  const metaInfo = pageInfos.value[newIndex - 1]
  if (metaInfo) {
    getTextOfImage(metaInfo.name)
  }
})

watch(currentBookName, (newBookName: string) => {
  fetchMetasInfos(newBookName)
})

watch(currentText, (newText: string, oldText: string) => {
  if (!isLoadingText && newText !== oldText) {
    isTextUpdated.value = true
  }
})

const currentItem = computed(() => pageInfos.value[currentIndex.value - 1])

const prevInfo = () => {
  if (currentIndex.value > 1) {
    currentIndex.value--
  }
}

const nextInfo = () => {
  if (currentIndex.value < pageInfos.value.length) {
    currentIndex.value++
  }
}

const updateDisplayMode = (newDisplayMode: DisplayMode) => {
  displayMode.value = newDisplayMode;
}

const showImageViewer = computed(() => displayMode.value === displayModeEnum.OnlyImage || displayMode.value === displayModeEnum.SplitImageAndEdition);
const showTextEditor = computed(() => displayMode.value === displayModeEnum.SplitImageAndEdition || displayMode.value === displayModeEnum.SplitTextAndEdition || displayMode.value === displayModeEnum.OnlyEdition);


</script>

<style lang="scss" scoped>
.loader {
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

#toolbar {
  height: 5%;

  #display-group-btn {
    display: flex;
    flex-direction: row;

    justify-content: center;
    align-items: center;

    &>div {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.5rem 1rem;
      background-color: #F6F6F6;
      color: #fff;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: background-color 0.3s, box-shadow 0.3s, transform 0.3s;

      &:hover {
        background-color: #2980b9;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transform: translateY(-2px);
      }

      &.active {
        background-color: #3498db;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transform: translateY(-2px);
      }
    }

    #button-left {
      border-top-left-radius: 0.25rem;
      border-bottom-left-radius: 0.25rem;
    }

    #button-middle {
      border-radius: 0;
    }

    #button-right {
      border-top-right-radius: 0.25rem;
      border-bottom-right-radius: 0.25rem;
    }

  }
}

#editor {
  height: 90%;
}

#navigator-bar {
  height: 5%;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
