<template>
  <view class="page">
    <scroll-view class="chat-scroll" scroll-y :scroll-with-animation="true" scroll-style="none" @scroll="onScroll"
      @touchstart="onTouchStart" :scroll-into-view="scrollIntoViewId">
      <view class="chat-body" :style="{ visibility: historyMessageLoaded ? 'visible' : 'hidden' }">
        <Chat :messages="messages" @finish="finish" @historyMessageFinish="historyMessageFinish" />
      </view>
      <view class="anchor" id="scroll-anchor"></view>
    </scroll-view>
    <view class="input-container">
      <input class="input" placeholder="请输入markdown文本url地址" @confirm="sendQuestion" v-model="inputText" />
      <button class="pause-button" @click="opClick">
        {{ isTyping ? "终止" : "发送" }}
      </button>
    </view>
    <view :class="['arrow', showArrow ? 'arrow-show' : 'arrow-hide']" v-if="showArrow"
      @click="scrollToBottomAndResumeAutoScroll">
      <text>↓</text>
    </view>
  </view>
</template>

<script>
import { onMounted, ref } from "vue";
import { Chat } from "./chat.vue";
const {
  setMdText,
  setStreamFinish,
  stopImmediatelyCb,
  scrollCb,
} = require("../../wxcomponents/towxml/globalCb");

export default {
  components: { Chat },
  setup() {
    const questionType = 0; //问题
    const answerType = 1; //答案
    const inputText = ref("");
    let content = "";
    let mdText = ""; //用来记录本次回答，流式接口累积返回的文本
    let timer = undefined;
    let scroller = 0;
    let curTowxmlId = ""; //记录当前正在打字的towxml组件的id
    const messages = ref([]);
    let autoScroll = true;
    const showArrow = ref(false);
    const screenHeight = uni.getSystemInfoSync().windowHeight;
    const isTyping = ref(false);
    const scrollIntoViewId = ref("");
    const historyMessageLoaded = ref(true) //标识历史消息是否加载完
    let finishedHistoryMessageNum = 0 //已经渲染好的历史消息
    let historyMessageNum = 0 //历史消息的数量

    async function sendQuestion() {
      if (!inputText.value) {
        return;
      }
      //有可能呢上次的答案还没打字完，你又发送了新的问题，那么做一下重置操作
      isTyping.value = false
      setStreamFinish(curTowxmlId);
      stopImmediatelyCb(curTowxmlId);

      messages.value.push({
        id: new Date().getTime(),
        content: inputText.value,
        type: questionType,
      });
      messages.value = [...messages.value];
      uni.request({
        url: inputText.value,
        // url: `http://110.41.9.23/static/video-embed.md`,
        // url: `http://110.41.9.23/static/md-editor-vue3.md`,
        // url: `https://zxx-wwj-oss.oss-cn-shenzhen.aliyuncs.com/schChoose/article/d338e6c9-dc59-45d1-8482-5ea21d05f449/923e9f20-46da-4026-844b-f6a2c14ec0eb.md`,
        // url: `https://zxx-wwj-oss.oss-cn-shenzhen.aliyuncs.com/schChoose/article/4d711758-074e-4be8-b280-77cc51719248/08c54e75-144f-426a-ba38-eb91cf464846.md`,
        encoding: "utf-8",
        success: (res) => {
          //记录当前正在打字的towxml组件实例的id,id一定要唯一，因为每个towxml组件都有对应的全局数据，以id为索引，id重复会导致数据使用错乱
          curTowxmlId = new Date().getTime();
          messages.value.push({
            id: curTowxmlId,
            type: answerType,
          });
          messages.value = [...messages.value];
          // 由于我没有大模型的流式接口，所以这里发给网络请求获取markdown文本，再使用定时器模拟流式接口，你的话就根据你的实际接口情况进行更改
          generateStreamData(res.data);
          inputText.value = "";
        },
        fail: (e) => {
          curTowxmlId = new Date().getTime();
          messages.value.push({
            id: curTowxmlId,
            type: answerType,
          });
          messages.value = [...messages.value];
          generateStreamData("文件访问错误！");
          inputText.value = "";
        },
      });
    }

    //模拟流式接口
    function generateStreamData(text) {
      isTyping.value = true;
      //重置当次流式接口对应的文本
      mdText = "";
      content = text;
      let c = 0;
      //使用定时器模拟流式接口
      timer = setInterval(() => {
        //每60*3毫秒将滚动条滚动到底部
        if (scroller % 60 == 0 && autoScroll) {
          scrollToBottom();
        }
        scroller++;
        //流式接口结束
        if (c >= content.length) {
          //通知towxml组件，流式接口结束，即本次回答所对应的所有markdown文本都已经拼接好了
          //因为towmxl组件判断打字结的条件是：1.你的流式接口已经结束，即不在产生新的文本  2.打字的字符已经超过了文本字符   必须同时满足这两个条件，才能说明打字结束
          // 你需要做的就是调用 setStreamFinish 函数通知到底层 towxml 组件流式接口结束，函数的参数是当前正在打字的 towxml 组件的 id
          setStreamFinish(curTowxmlId);
          return;
        }
        //累积流式接口返回的文本，我这里模拟流式接口，所以是一个个字符取的，你当前流式接口返回多少字符，就全部拼接上即可
        mdText = mdText + content[c];
        //调用setMdText函数将最新的文本通知到底层towxml组件，函数的参数是当前正在打字的towxml组件的id，也就是<towxml :towxmlId="msgItem.id" :speed="speed" @finish="finish" />中，这个towxmlId
        setMdText(curTowxmlId, mdText);
        c++;
      }, 3);
    }

    //滚动到底部
    function scrollToBottom() {
      scrollIntoViewId.value = "";
      function scrollRender() {
        scrollIntoViewId.value = "scroll-anchor";
      }
      setTimeout(scrollRender, 0);
    }

    //当前回答的打字结束，finsih会被回调，你可以做一些关掉滚动定时器等善后操作
    function finish(e) {
      console.log(e);
      clearInterval(timer);
      isTyping.value = false;
    }

    //每当一条历史消息渲染完毕，就会回调这个函数，当所有的历史消息都渲染完毕，将visibility设为visible
    function historyMessageFinish(e) {
      finishedHistoryMessageNum++
      //渲染的历史消息数量大于等于历史消息总数，说明全部渲染完毕
      if (finishedHistoryMessageNum >= historyMessageNum) {
        scrollToBottom();
        //因为滚动到底部需要一点时间，所以800毫秒之后再设置可见
        const timer = setTimeout(() => {
          uni.hideLoading();
          historyMessageLoaded.value = true;
          clearTimeout(timer)
        }, 800)
      }
      console.log("收到一条历史消息渲染完毕的回调")
    }

    const onTouchStart = () => {
      //只有正在打字的时候，用户滑动一下出现下滑箭头
      if (!isTyping.value) {
        return;
      }
      uni
        .createSelectorQuery()
        .select(".chat-scroll")
        .scrollOffset((res) => {
          const scrollHeight = res.scrollHeight;
          if (scrollHeight > screenHeight) {
            autoScroll = false;
            showArrow.value = true;
          }
        })
        .exec();
    };

    //点击箭头下滑到底部，并开启自动滚动更新
    function scrollToBottomAndResumeAutoScroll() {
      autoScroll = true;
      showArrow.value = false;
      scrollToBottom();
    }

    function opClick() {
      if (isTyping.value) {
        isTyping.value = false
        stopImmediatelyCb(curTowxmlId);
      } else {
        sendQuestion();
      }
    }

    // 滚动事件回调，记得在滚动事件中回调 scrollCb，并把参数进行传入，我会根据这个参数判断滚动方向，这样 towxml 组件内部才知道你滚动了，就会帮你进行虚拟显示
    // 如果你没有回调 scrollCb，towxml 组件内部就不会进行虚拟显示，随着程序的持续运行，对话次数的增多，页面的 dom 节点会越来越多，导致 1. 内存占用过大而发烫闪退  2. 随着内存占用过大，垃圾回收频繁，占据了很多运行时间，导致后期的打字速度受影响
    function onScroll(e) {
      scrollCb(e);
    }

    onMounted(() => {
      uni.showModal({
        title: '提示',
        content: '是否加载历史消息？',
        confirmText: '确定',
        confirmColor: '#FF0000',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            historyMessageLoaded.value = false
            uni.showLoading({
              title: '历史消息加载中',
              mask: true
            });
            finishedHistoryMessageNum = 0
            historyMessageNum = 0
            uni.request({
              url: `http://110.41.9.23/static/video-embed.md`,
              encoding: "utf-8",
              success: async (res) => {
                //构造30条历史消息
                for (let i = 1; i <= 30; i++) {
                  const curId = new Date().getTime();
                  messages.value.push({
                    id: curId,
                    content: `历史问题${i}`,
                    type: questionType,
                    isHistoryMessage: true
                  });
                  //加个3,防止id重复
                  const towxmlId = curId + 3
                  messages.value.push({
                    id: towxmlId,
                    type: answerType,
                    isHistoryMessage: true,
                  });
                  //历史消息数量加1
                  historyMessageNum++
                  //必须在渲染历史消息之前就调用这个函数，务必记得！！！
                  setMdText(towxmlId, res.data)
                  //堵塞一下，防止由时间生成的id重复
                  await new Promise((resolve) => {
                    const timer = setTimeout(() => {
                      resolve()
                      clearTimeout(timer)
                    }, 10)
                  })
                }
                //渲染历史消息
                messages.value = [...messages.value];
              }
            });
          }
        }
      });
    })

    return {
      inputText,
      sendQuestion,
      finish,
      messages,
      onTouchStart,
      scrollToBottomAndResumeAutoScroll,
      showArrow,
      opClick,
      isTyping,
      scrollIntoViewId,
      onScroll,
      historyMessageFinish,
      historyMessageLoaded
    };
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
