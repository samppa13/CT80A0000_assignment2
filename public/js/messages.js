import { message } from './dom.js'

let noticeTimer

export const showMessage = (text, isError = false) => {
    clearTimeout(noticeTimer)
    message.textContent = text
    message.classList.remove('hidden', 'error')

    if (isError) message.classList.add('error')

    noticeTimer = setTimeout(() => message.classList.add('hidden'), 3500)
}
