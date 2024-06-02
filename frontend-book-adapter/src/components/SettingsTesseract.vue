<template>
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div ref="customDiv" @click.stop class="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 class="text-xl font-bold mb-4">Tesseract Settings</h2>
            <div class="mb-4">
                <label for="ocrOem" class="block mb-2">OEM</label>
                <select v-model="ocrOem" id="ocrOem" class="p-2 border border-gray-300 rounded w-full">
                    <option value="0">OEM 0 (Legacy only)</option>
                    <option value="1">OEM 1 (Neural nets LSTM only)</option>
                    <option value="2">OEM 2 (Legacy + LSTM)</option>
                    <option value="3">OEM 3 (Default, based on what is available)</option>
                </select>
            </div>
            <div class="mb-4">
                <label for="ocrPsm" class="block mb-2">PSM</label>
                <select v-model="ocrPsm" id="ocrPsm" class="p-2 border border-gray-300 rounded w-full">
                    <option value="0">PSM 0 (Orientation and script detection)</option>
                    <option value="1">PSM 1 (Automatic page segmentation with OSD)</option>
                    <option value="3">PSM 3 (Fully automatic page segmentation)</option>
                    <option value="4">PSM 4 (Assume a single column of text of variable sizes)</option>
                    <option value="5">PSM 5 (Assume a single uniform block of vertically aligned text)</option>
                    <option value="6">PSM 6 (Assume a single uniform block of text)</option>
                    <option value="7">PSM 7 (Treat the image as a single text line)</option>
                    <option value="11">PSM 11 (Sparse text)</option>
                    <option value="12">PSM 12 (Sparse text with OSD)</option>
                </select>
            </div>
            <div class="mb-4">
                <label for="ocrLang" class="block mb-2">Language</label>
                <select v-model="ocrLang" id="ocrLang" class="p-2 border border-gray-300 rounded w-full">
                    <option value="eng">English</option>
                    <option value="fra">French</option>
                    <option value="spa">Spanish</option>
                    <option value="deu">German</option>
                </select>
            </div>
            <button @click="saveSettings" class="bg-blue-500 text-white px-4 py-2 rounded mr-2">Save</button>
            <button @click="closePopup" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
        </div>
    </div>
</template>

<script setup lang="ts">

import { ref,  onUnmounted, defineProps, defineEmits, watch } from 'vue'

const props = defineProps({
    visible: Boolean
})

const emit = defineEmits(['onSave', 'onClose'])
const customDiv = ref<HTMLElement | null>(null)
const ocrOem = ref<string>(localStorage.getItem('ocrOem') || '3')
const ocrPsm = ref<string>(localStorage.getItem('ocrPsm') || '3')
const ocrLang = ref<string>(localStorage.getItem('ocrLang') || 'eng')


onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside)
})


watch(() => props.visible, value => 
    setTimeout(() => document[`${value ? 'add' : 'remove'}EventListener`]('click', handleClickOutside)));

const handleClickOutside = () => {

    closePopup()
}

const saveSettings = () => {
    localStorage.setItem('ocrOem', ocrOem.value)
    localStorage.setItem('ocrPsm', ocrPsm.value)
    localStorage.setItem('ocrLang', ocrLang.value)
    
    closePopup()
}

const closePopup = () => {
    emit('onClose')
}

</script>



