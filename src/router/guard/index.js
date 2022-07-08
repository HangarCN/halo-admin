import NProgress from 'nprogress'
import { domTitle, setDocumentTitle } from '@/utils/domUtil'
import store from '@/store'
import storage from 'store'
import { ACCESS_TOKEN } from '@/store/mutation-types'
import notification from 'ant-design-vue/es/notification'
import { isAuthorizationCode, authorize } from '@/apis/auth'
import { get, isNil } from 'lodash'
import _ from 'lodash'
import { asyncRouterMap } from '@/config/router.config'

const WHITE_LIST = [
  'Login',
  'Install',
  'NotFound',
  'ResetPassword',
  'AuthorizationLogin',
  'AuthorizationCode',
  'register',
  'registerResult'
]
const loginRoutePath = '/login'
const defaultRoutePath = '/'

/**
 *  动态路由
 * @param {object} router 路由
 * @param {object} from 来源路由
 * @param {object} to 访问路由
 * @param {function} next 跳转函数
 */
const dynamicRoutes = (router, from, to, next) => {
  store
    .dispatch('refreshUserCache')
    .then(result => {
      console.log('用户信息', result)
      store.dispatch('refreshAsyncRouters', generateRoutes(asyncRouterMap, result.data.data.permissions))
      router.addRoutes(store.getters.asyncRouters)
      const redirect = decodeURIComponent(from.query.redirect || to.path)
      if (to.path === redirect) {
        next({ ...to, replace: true })
      } else {
        next({ path: redirect })
      }
    })
    .catch(err => {
      notification.error({
        message: '错误',
        description: err
      })
      store.dispatch('Logout').then(() => {
        next({ path: loginRoutePath, query: { redirect: to.fullPath } })
      })
    })
}

const generateRoutes = (routers, permissions) => {
  const result = []
  routers.forEach(route => {
    const newRoute = _.cloneDeep(route)
    if (hasPermission(newRoute, permissions)) {
      result.push(newRoute)
      if (newRoute.children && newRoute.children.length) {
        newRoute.children = generateRoutes(newRoute.children, permissions)
      }
    }
  })
  return result
}

/**
 * 判断是否拥有路由权限
 *
 * @param route 路由实体
 * @param permissions 权限实体数组
 * @returns boolean 是否拥有权限 true 是, false 否
 */
function hasPermission(route, permissions) {
  let result = true
  if (route.meta && route.meta.permissions) {
    result = false
    for (const permission of permissions) {
      if (route.meta.permissions.includes(permission)) {
        result = true
        break
      }
    }
  }
  return result
}

/**
 * 是否未登录
 * @returns 结构
 */
const isNotLogin = () => {
  return isNil(storage.get(ACCESS_TOKEN))
}

/**
 * 是否未没权限
 * @returns 结构
 */
const isNoPermissions = () => {
  return !store.getters.user || store.getters.user.permissions.length === 0
}

/**
 * 是否白名单路由
 * @param {string} routeName 路由名称
 * @returns 结果
 */
const isWhiteList = routeName => {
  return WHITE_LIST.includes(routeName)
}

/**
 * 跳转到登录路由
 * @param {object} to 访问路由
 * @param {function} next 跳转函数
 */
const loginRoute = (to, next) => {
  if (isAuthorizationCode()) {
    const clientAuthorizeCode = get(to, 'query.code')
    if (clientAuthorizeCode) {
      next({ path: '/login/authorization-code', query: { code: clientAuthorizeCode } })
    } else {
      storage.set('authorizationCodeRedirectUrl', to.fullPath)
      authorize()
    }
  } else {
    next({ path: loginRoutePath, query: { redirect: to.fullPath } })
  }
}

/**
 * 路由守卫
 * @param {object} router 路由
 */
const guard = async router => {
  NProgress.configure({ showSpinner: false })
  router.beforeEach((to, from, next) => {
    NProgress.start()
    to.meta && typeof to.meta.title !== 'undefined' && setDocumentTitle(`${to.meta.title} - ${domTitle}`)
    if (isWhiteList(to.name)) {
      next()
      return
    }
    if (isNotLogin()) {
      loginRoute(to, next)
      return
    }

    if (!store.getters.options) {
      store.dispatch('refreshOptionsCache').then()
    }

    if (to.path === loginRoutePath) {
      next({ path: defaultRoutePath })
      return
    }
    ;(isNoPermissions() && dynamicRoutes(router, from, to, next)) || next()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}

export default guard
