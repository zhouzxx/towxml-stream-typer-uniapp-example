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
              :speed="400"
              :isFinish="isFinish"
              @finish="finish"
            />
          </view>
        </view>
        <view class="anchor" id="scroll-anchor"></view>
      </view>
    </scroll-view>
    <view class="input-container">
      <input
        class="input"
        placeholder="发消息..."
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
    const mdText = ref("");
    let timer = undefined;
    uni.request({
      // url: `http://110.41.9.23/static/video-embed.md`,
      url: `http://110.41.9.23/static/test6060.md`,
      // url: `https://zxx-wwj-oss.oss-cn-shenzhen.aliyuncs.com/schChoose/article/d338e6c9-dc59-45d1-8482-5ea21d05f449/923e9f20-46da-4026-844b-f6a2c14ec0eb.md`,
      // url: `https://zxx-wwj-oss.oss-cn-shenzhen.aliyuncs.com/schChoose/article/4d711758-074e-4be8-b280-77cc51719248/08c54e75-144f-426a-ba38-eb91cf464846.md`,
      encoding: "utf-8",
      success: (res) => {
        content = res.data;
      },
      fail: (e) => {
        md.value = towxml("请求发送失败", "markdown");
      },
    });

    async function sendQuestion() {
      let c = 0;
      //模拟流式接口
      timer = setInterval(() => {
        if (c % 100 == 0) {
          scrollIntoViewId.value = "";
          setTimeout(() => {
            scrollIntoViewId.value = "scroll-anchor";
          }, 0);
        }
        if (c >= content.length) {
          isFinish.value = true;
          return;
        }
        mdText.value = mdText.value + content[c];
        c++;
      }, 10);
      inputText.value = "请输入";
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
    };
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
