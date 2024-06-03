<template>
  <div id="page-editor" class="min-h-[calc(100vh-66px)] bg-gray-100 p-4 flex flex-col">
    <div class="bg-white shadow-md rounded-lg p-6 flex flex-col flex-grow w-full overflow-hidden mb-2">

      <div id="toolbar" class="toolbar mb-4 w-full">
        <!-- First Row -->
        <div class="toolbar-row">
          <select v-model="currentBookName" class="toolbar-select flex-grow">
            <option v-for="bookName in booksNames" :key="bookName" :value="bookName">{{ bookName }}</option>
          </select>

          <div id="display-group-btn" class="grid grid-cols-2 grid-rows-2 gap-0 border-left">
            <div class="btn" :class="{ 'active': displayMode === displayModeEnum.SplitImageAndEdition }"
              v-on:click="updateDisplayMode(displayModeEnum.SplitImageAndEdition)">🖼️|✏️</div>
            <div class="btn" :class="{ 'active': displayMode === displayModeEnum.SplitTextAndEdition }"
              v-on:click="updateDisplayMode(displayModeEnum.SplitTextAndEdition)">📄|✏️</div>
            <div class="btn" :class="{ 'active': displayMode === displayModeEnum.OnlyEdition }"
              v-on:click="updateDisplayMode(displayModeEnum.OnlyEdition)">✏️</div>
            <div class="btn" :class="{ 'active': displayMode === displayModeEnum.OnlyImage }"
              v-on:click="updateDisplayMode(displayModeEnum.OnlyImage)">🖼️</div>
          </div>
        </div>

        <!-- Second Row -->
        <div class="toolbar-row mt-2">
          <div class="vertical-btn-group">
            <div class="font-size-controls">
              <button @click="decreaseFontSize" class="toolbar-btn">-</button>
              <span class="font-size-display">{{ fontSize.toFixed(2) }}rem</span>
              <button @click="increaseFontSize" class="toolbar-btn">+</button>
            </div>
          </div>

          <div class="vertical-btn-group border-left">
            <select v-model="ocrMethod" class="toolbar-select">
              <option :value="ocrMethode.Tesseract">Tesseract</option>
              <option :value="ocrMethode.OpenAiVision">OpenAi Vision</option>
            </select>

            <select v-model="ocrLang" class="toolbar-select">
              <option value="eng">English</option>
              <option value="fra">French</option>
              <option value="spa">Spanish</option>
              <option value="deu">German</option>
            </select>
          </div>

          <div class="vertical-btn-group">
            <select v-model="ocrOem" class="toolbar-select">
              <option value="0">OEM 0</option>
              <option value="1">OEM 1</option>
              <option value="2">OEM 2</option>
              <option value="3">OEM 3</option>
            </select>
            <select v-model="ocrPsm" class="toolbar-select">
              <option value="0">PSM 0</option>
              <option value="1">PSM 1</option>
              <option value="3">PSM 3</option>
              <option value="4">PSM 4</option>
              <option value="5">PSM 5</option>
              <option value="6">PSM 6</option>
              <option value="7">PSM 7</option>
              <option value="11">PSM 11</option>
              <option value="12">PSM 12</option>
            </select>
          </div>

          <div class="vertical-btn-group border-left">
            <button @click="deleteUselessBreakline" class="toolbar-btn">\n</button>
            <button @click="getTesseractText" class="toolbar-btn">OCR</button>
          </div>

          <button @click="toggleSettings" class="toolbar-btn flex items-center border-left">
            <span class="material-icons">⚙️</span>
          </button>
          <button @click="cancelTextUpdate" :disabled="!isTextUpdated" class="toolbar-btn cancel-btn border-left">🗙 Cancel</button>
          <button @click="saveTextUpdate" :disabled="!isTextUpdated" class="toolbar-btn save-btn border-left">🖫 Save</button>
        </div>
      </div>

      <div id="editor" class="flex-grow flex space-x-4 w-full overflow-hidden">
        <!-- Image Viewer -->
        <div v-if="showImageViewer" id="image-viewer" class="flex-1 rounded-lg overflow-auto">
          <img v-if="currentItem"
            :src="`http://localhost:3000/api/getBookImage/${currentBookName}/${currentItem.name}.png`"
            alt="Image not found" class="w-full object-contain" />
        </div>

        <!-- Text Viewer -->
        <div v-if="displayMode === displayModeEnum.SplitTextAndEdition" id="text-viewer" class="flex-1 overflow-hidden">
          <div class="relative w-full h-full">
            <textarea v-model="currentText" readonly name="text-viewer" id="text-viewer" cols="30" rows="10"
              :style="{ fontSize: fontSize + 'rem' }"
              class="w-full h-full p-2 border border-gray-300 rounded bg-gray-100"></textarea>
            <div class="absolute top-2 right-2 bg-gray-200 text-gray-700 px-2 py-1 text-xs rounded">Saved text</div>
          </div>
        </div>

        <!-- Text Editor -->
        <div v-if="showTextEditor" id="text-editor" class="flex-1 overflow-hidden">
          <textarea v-model="currentText" name="text-editor" id="text-editor" cols="30" rows="10"
            :style="{ fontSize: fontSize + 'rem' }" class="w-full h-full p-2 border border-gray-300 rounded"></textarea>
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

    <TesseractSettings :visible="showSettings" @onClose="toggleSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import axios from 'axios'
import TesseractSettings from './SettingsTesseract.vue'

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
const fontSize = ref<number>(0.65)
const ocrOem = ref<string>(localStorage.getItem('ocrOem') || '3')
const ocrPsm = ref<string>(localStorage.getItem('ocrPsm') || '3')
const ocrLang = ref<string>(localStorage.getItem('ocrLang') || 'eng')

const showSettings = ref(false)

const displayModeEnum = {
  OnlyEdition: 'OnlyEdition',
  OnlyImage: 'OnlyImage',
  SplitImageAndEdition: 'SplitImageAndEdition',
  SplitTextAndEdition: 'SplitTextAndEdition'
}

const ocrMethode = {
  Tesseract: 'Tesseract',
  OpenAiVision: 'OpenAiVision'
}

const displayMode = ref(displayModeEnum.SplitImageAndEdition)
const ocrMethod = ref(ocrMethode.Tesseract)

const fetchMetasInfos = async (newBookName: string) => {
  try {
    isLoading.value = true
    const response = await axios.get(`http://localhost:3000/api/getBookPagesInfos?bookName=${newBookName}`)
    pageInfos.value = response.data
    if (pageInfos.value.length > 0) {
      await getTextOfImage()
    }
  } catch (error) {
    console.error('Error while gathering pageInfos:', error)
  } finally {
    isLoading.value = false
  }
}

const getTextOfImage = async (isForceOcr: boolean = false) => {
  try {
    let bookName = currentBookName.value
    isLoading.value = true
    isLoadingText = true;
    let imageName = currentItem.value.name
    let request = `http://localhost:3000/api/getTextOfImage?bookName=${bookName}&imageName=${imageName}&isForceOcr=${isForceOcr}`
    const response = await axios.get(request)
    currentText.value = response.data.text
    if (!isForceOcr) {
      initialText.value = response.data.text
      isTextUpdated.value = false
    } else {
      isTextUpdated.value = true
    }
  } catch (error) {
    console.error('Error while gathering text of the image:', error)
  } finally {
    isLoading.value = false
    new Promise(resolve => setTimeout(resolve, 1000)).then(() => isLoadingText = false);
  }
}

const getTesseractText = async () => {
  try {
    isLoading.value = true
    let oem = localStorage.getItem('ocrOem') || '3'
    let psm = localStorage.getItem('ocrPsm') || '3'
    let language = localStorage.getItem('ocrLang') || 'eng'
    let request = `http://localhost:3000/api/getTesseractText/${currentBookName.value}/${currentItem.value.name}/${language}/${oem}/${psm}`
    const response = await axios.get(request)
    currentText.value = response.data.text
  } catch (error) {
    console.error('Error while gathering text of the image:', error)
  } finally {
    isLoading.value = false
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
    initialText.value = currentText.value
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
    getTextOfImage()
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

watch(ocrOem, (newOcrOem: string) => {
  localStorage.setItem('ocrOem', newOcrOem)
})

watch(ocrPsm, (newOcrPsm: string) => {
  localStorage.setItem('ocrPsm', newOcrPsm)
})

watch(ocrMethod, (newOcrMethod: string) => {
  if (newOcrMethod === ocrMethode.OpenAiVision) {
    alert('OpenAi Vision is not yet implemented')
  }
  else{
    localStorage.setItem('ocrMethod', newOcrMethod)
  }
})

watch(ocrLang, (newOcrLang: string) => {
  localStorage.setItem('ocrLang', newOcrLang)
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

const updateDisplayMode = (newDisplayMode) => {
  displayMode.value = newDisplayMode
}

const showImageViewer = computed(() => displayMode.value === displayModeEnum.OnlyImage || displayMode.value === displayModeEnum.SplitImageAndEdition)
const showTextEditor = computed(() => displayMode.value === displayModeEnum.SplitImageAndEdition || displayMode.value === displayModeEnum.SplitTextAndEdition || displayMode.value === displayModeEnum.OnlyEdition)

const deleteUselessBreakline = () => {
  let processedText = currentText.value
    .replace(/\n\s*\n/g, '\n')  // Replace double newlines with a single newline
    .replace(/([^\.\n»\?])\n/g, '$1 ')  // Replace undesired newlines with spaces
    .replace(/(^|\n)\s+/g, '$1')  // Remove spaces at the start of each line
    .trim()
    .replace(/(^|\n)(?!\t)/g, '$1\t');  // Add a tab at the start of each new line if there isn't one already

  currentText.value = processedText;
}

const increaseFontSize = () => {
  fontSize.value += 0.05;
}

const decreaseFontSize = () => {
  if (fontSize.value > 0.1) {
    fontSize.value -= 0.05;
  }
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}
</script>

<style lang="scss" scoped>
.loader {
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

#toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .toolbar-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .toolbar-select, .toolbar-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f6f6f6;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s, box-shadow 0.3s, transform 0.3s;

    &:hover {
      background-color: #e0e0e0;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f6f6f6;
    color: #333;

    &.cancel-btn {
      background-color: #f44336;
      color: #fff;

      &:hover {
        background-color: #e53935;
      }
    }

    &.save-btn {
      background-color: #4caf50;
      color: #fff;

      &:hover {
        background-color: #43a047;
      }
    }

    &.active {
      background-color: #2196f3;
      color: #fff;
    }

    &:disabled {
      background-color: #d3d3d3;
      color: #888;
      cursor: not-allowed;
    }
  }

  .vertical-btn-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 0;
  }

  .btn {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5rem;
    background-color: #f6f6f6;
    color: #333;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s, box-shadow 0.3s, transform 0.3s;
    font-size: 14px;

    &:hover {
      background-color: #2980b9;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    &.active {
      background-color: #3498db;
      color: #fff;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }
  }

  .border-left {
    border-left: 1px solid #ccc;
    padding-left: 10px;
  }

  .font-size-controls {
    display: flex;
    align-items: center;

    .font-size-display {
      margin: 0 10px;
      font-size: 14px;
    }
  }
}

#editor {
  height: 90%;
}

#navigator-bar {
  height: 4%;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
