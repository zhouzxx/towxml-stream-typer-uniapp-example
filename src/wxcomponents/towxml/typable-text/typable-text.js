Component({
  options: {
    styleIsolation: "shared",
  },
  properties: {
    text: {
      type: String,
      value: "",
    }
  },
  observers: {
    "text": function (newVal) {
      this.setData({ showText: this.data.text });
    }
  },
  lifetimes: {
    attached: function () {
      const {
        textRenderCb
      } = require("./text-cb");
      this.showText = this.data.text
      this.setData({ showText: this.data.text });
      // console.log("文字组件初始化完成")
      textRenderCb.value = (newText, curShowText) => {
        const tmpText = this.data.text + newText
        //这个if是防止后面的文本错误地添加到前面地文本组件实例上
        if (curShowText.length === tmpText.length && curShowText === tmpText) {
          this.data.text = tmpText
          this.setData({ showText: this.data.text });
        }
      }
    },
  },
  data: {
    showText: ""
  },
  methods: {
    show() {
      this.data.isShow = true;
      this.setData({ isShow: this.data.isShow });
    },
  },
});
