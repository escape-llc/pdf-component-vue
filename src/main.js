import './assets/main.css'

import { createApp } from 'vue'
import App from './app/App.vue'
import router from './app/router'

const app = createApp(App)

app.use(router)

app.mount('#app')
