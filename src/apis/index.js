import axios from 'axios'
import qs from 'qs'

import { DefaultAxiosClient, AuthApi } from '@hangar/api-client'

export const apiClient = new DefaultAxiosClient(axios.create())

export const authApi = new AuthApi(apiClient)

export const request = (method, url, body, queryParameters, form, config) => {
  method = method.toLowerCase()
  let keys = Object.keys(queryParameters)
  let queryUrl = url
  if (keys.length > 0) {
    queryUrl = url + '?' + qs.stringify(queryParameters)
  }
  // let queryUrl = url+(keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '')
  if (body) {
    return axios[method](queryUrl, body, config)
  } else if (method === 'get') {
    return axios[method](
      queryUrl,
      {
        params: form
      },
      config
    )
  } else {
    return axios[method](queryUrl, qs.stringify(form), config)
  }
}
