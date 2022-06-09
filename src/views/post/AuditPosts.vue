<template>
  <page-view>
    <a-card :bodyStyle="{ padding: '16px' }" :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="6" :sm="24">
              <a-form-item label="关键词：">
                <a-input v-model="searchParams.keyword" @keyup.enter="getAuditPostsList()" placeholder="请输入关键字" />
              </a-form-item>
            </a-col>
            <a-col :md="6" :sm="24">
              <a-form-item label="分类目录：">
                <CategorySelectTree
                  :categories="categories.data"
                  :category-id.sync="searchParams.categoryId"
                  :root="{
                    id: 0,
                    title: '全部',
                    value: '0',
                    pId: -1
                  }"
                  @change="getAuditPostsList"
                />
              </a-form-item>
            </a-col>

            <a-col :md="6" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-space>
                  <a-button type="primary" @click="getAuditPostsList()">查询</a-button>
                  <a-button @click="handleResetParam()">重置</a-button>
                </a-space>
              </span>
            </a-col>
          </a-row>
        </a-form>
        <div>
          <a-button type="primary" icon="audit" :disabled="auditBtnDisabled">批量审核</a-button>
        </div>
        <div>
          <a-table
            :columns="auditPostsColumns"
            :dataSource="list.data"
            :loading="list.loading"
            :pagination="false"
            :rowKey="post => post.id"
            :rowSelection="{
              selectedRowKeys: selectedRowKeys,
              onChange: onSelectionChange
            }"
            :scrollToFirstRowOnChange="true"
          >
            <template #status="status">
              <a-badge :status="postStatuses[status].status" :text="status | statusText" />
            </template>

            <template #categories="categories">
              <a-tag v-for="(category, index) in categories" :key="index" color="blue" style="margin-bottom: 8px">
                {{ category.name }}
              </a-tag>
            </template>

            <template #tags="tags">
              <post-tag v-for="(tag, index) in tags" :key="index" :tag="tag" style="margin-bottom: 8px" />
            </template>

            <template #createTime="createTime">
              <a-tooltip placement="top">
                <template #title>
                  {{ createTime | moment }}
                </template>
                {{ createTime | timeAgo }}
              </a-tooltip>
            </template>

            <template #action="text, post">
              <a @click="handleAudit(post.id)">审核</a>
            </template>
          </a-table>
        </div>
        <div style="margin-top: 10px; text-align: right">
          <a-pagination
            :total="list.total"
            :current="searchParams.size"
            :defaultPageSize="10"
            :show-total="total => `共有 ${total} 条数据`"
            @change="pageChange"
            @showSizeChange="pageSizeChange"
            show-size-changer
            show-quick-jumper
          />
        </div>
      </div>
    </a-card>
  </page-view>
</template>

<script>
// components
import { PageView } from '@/layouts'
import { auditPostsColumns, postStatuses } from '@/core/constant'
import CategorySelectTree from '@/components/Category/CategorySelectTree'

// libs
import apiClient from '@/utils/api-client'
export default {
  name: 'AuditPosts',
  components: {
    PageView,
    CategorySelectTree
  },
  data() {
    return {
      auditPostsColumns,
      postStatuses,
      searchParams: {
        keyword: undefined,
        categoryId: undefined,
        size: 10,
        page: 0,
        more: true
      },
      categories: {
        data: [],
        loading: false
      },
      list: {
        data: [],
        loading: false,
        total: 0
      },
      selectedRowKeys: [],
      auditBtnDisabled: true
    }
  },
  mounted() {
    this.handleListCategories()
    this.getAuditPostsList()
  },
  watch: {
    selectedRowKeys: {
      handler(val) {
        this.auditBtnDisabled = !val.length
      }
    }
  },
  methods: {
    getAuditPostsList() {
      this.list.loading = true
      this.$http({
        method: 'get',
        url: '/api/admin/posts/page-to-be-audit',
        params: this.searchParams
      })
        .then(resp => {
          this.list.data = resp.data.content
          this.list.total = resp.data.total
        })
        // eslint-disable-next-line
        .catch(e => {})
        .finally(() => {
          this.list.loading = false
        })
    },

    handleResetParam() {
      this.searchParams = this.$options.data.call(this).searchParams
    },

    /**
     * Fetch categories data
     */
    async handleListCategories() {
      try {
        this.categories.loading = true
        const response = await apiClient.category.list({ sort: [], more: true })
        this.categories.data = response.data
      } catch (error) {
        this.$log.error(error)
      } finally {
        this.categories.loading = false
      }
    },

    handleAudit(postId) {
      this.$router.push({
        path: '/auditPosts/detail/' + postId,
        query: {
          id: postId
        }
      })
    },

    onSelectionChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys
    },

    pageChange(current) {
      this.searchParams.page = current - 1
      this.getAuditPostsList()
    },

    pageSizeChange(pageSize) {
      this.searchParams.size = pageSize
      this.getAuditPostsList()
    }
  },
  filters: {
    statusText(type) {
      return type ? postStatuses[type].text : ''
    }
  }
}
</script>

<style scoped></style>
