<template>
  <view class="page">
    <scroll-view
      class="page-scroll"
      scroll-y
      :scroll-with-animation="true"
      :scroll-into-view="scrollIntoViewId"
      scroll-style="none"
    >
      <view class="scroll-container">
        <view :class="['item']">
          <view class="answer-item">
            <towxml
              :mdText="mdText"
              :speed="speed"
              :isFinish="isFinish"
              @finish="finish"
              v-if="isShow"
            />
          </view>
        </view>
        <view class="anchor" id="scroll-anchor"></view>
      </view>
    </scroll-view>
    <view class="input-container">
      <input
        class="input"
        placeholder="请输入markdown文本地址"
        @confirm="sendQuestion"
        v-model="inputText"
      />
    </view>
  </view>
</template>

<script>
import { ref } from "vue";

export default {
  setup() {
    const questionType = 0;
    const answerType = 1;
    const inputText = ref("");
    const scrollIntoViewId = ref("");
    let content = "";
    const isFinish = ref(false);
    const mdText = { text: "" };
    let timer = undefined;
    const speed = 10;
    let scroller = 0;
    const isShow = ref(false);

    async function sendQuestion() {
      isFinish.value = false
      isShow.value = false;
      mdText.text = "";
      if (timer) {
        clearInterval(timer);
      }
      setTimeout(() => {
        isShow.value = true;
        uni.request({
          url: inputText.value,
          // url: `http://110.41.9.23/static/video-embed.md`,
          // url: `http://110.41.9.23/static/md-editor-vue3.md`,
          // url: `https://zxx-wwj-oss.oss-cn-shenzhen.aliyuncs.com/schChoose/article/d338e6c9-dc59-45d1-8482-5ea21d05f449/923e9f20-46da-4026-844b-f6a2c14ec0eb.md`,
          // url: `https://zxx-wwj-oss.oss-cn-shenzhen.aliyuncs.com/schChoose/article/4d711758-074e-4be8-b280-77cc51719248/08c54e75-144f-426a-ba38-eb91cf464846.md`,
          encoding: "utf-8",
          success: (res) => {
            generateStreamData(res.data)
            inputText.value = "";
          },
          fail: (e) => {
            generateStreamData("文件访问错误！")
            inputText.value = "";
          },
        });
      }, 1200);
    }

    function generateStreamData(text) {
      content = text;
      let c = 0;
      //模拟流式接口
      timer = setInterval(() => {
        if (scroller % 100 == 0) {
          scrollIntoViewId.value = "";
          setTimeout(() => {
            scrollIntoViewId.value = "scroll-anchor";
          }, 0);
        }
        scroller++;
        if (c >= content.length) {
          isFinish.value = true;
          return;
        }
        mdText.text = mdText.text + content[c];
        c++;
      }, 3);
    }

    function finish(e) {
      console.log(e);
      clearInterval(timer);
    }

    return {
      questionType,
      answerType,
      inputText,
      sendQuestion,
      scrollIntoViewId,
      isFinish,
      mdText,
      finish,
      speed,
      isShow,
    };
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
