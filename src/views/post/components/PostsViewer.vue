<template>
  <a-modal v-model="visible" :footer="null" :title="postDetail.title" width="50%" @cancel="handleClose">
    <div class="post-content" v-html="postDetail.content"></div>
  </a-modal>
</template>

<script>
export default {
  name: 'PostsViewer',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    postDetail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      visible: false
    }
  },
  watch: {
    value: {
      handler(val) {
        this.visible = val
      },
      immediate: true
    }
  },
  methods: {
    handleClose() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.post-content {
  height: 500px;
  overflow: auto;
}
</style>
