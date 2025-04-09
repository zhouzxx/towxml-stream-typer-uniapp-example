const mkSyntaxChars = [
  "\n",
  "#",
  "*",
  "_",
  "`",
  ">",
  "[",
  "]",
  "(",
  ")",
  "|",
  "-",
  "+",
  ".",
  "-",
  "\\",
  "^",
  "~",
  ":",
  "=",
  "$",
  "&",
  " "
];
const towxml = require("./index");
const {
  textRenderCb,
} = require("./typable-text/text-cb");
Component({
  options: {
    styleIsolation: 'shared',
  },
  properties: {
    mdText: {
      type: String,
      value: ""
    },
    speed: {
      type: Number,
      value: 20
    },
    isFinish: {
      type: Boolean,
      value: false
    },
    openTyper: {
      type: Boolean,
      value: true
    },
    theme: {
      type: String,
      value: "light"
    }
  },
  observers: {
    "mdText": function (newVal) {
      if (!this.data.openTyper) {
        this.setData('dataNodes', towxml(
          newVal,
          "markdown"
        ));
      }
      if (this.data.openTyper && newVal && !this.isStarted) {
        this.isStarted = true
        this.startType()
      }
    }
  },
  lifetimes: {
    ready: function () {
      if (this.data.openTyper && this.data.mdText && !this.isStarted) {
        this.isStarted = true
        this.startType()
      }
    },
  },
  data: {
    dataNodes: [],
    isStarted: false
  },
  methods: {
    startType() {
      const _this = this
      let finishIndex = -1;
      let c = 0;
      let typerText = "";
      let allText = "";
      let oldFirstLevelChildNodes = [];
      let timer = undefined;
      let curShowText = "";
      let flag = false;
      timer = setInterval(() => {
        if (_this.data.isFinish && c >= _this.data.mdText.length) {
          this.triggerEvent('finish', {
            message: '打字完毕！'
          });
          clearInterval(timer);
          return;
        }
        if (!_this.data.mdText || c >= _this.data.mdText.length) {
          return
        }
        c++;
        const singleChar = _this.data.mdText[c];
        if (singleChar == undefined) {
          return
        }
        typerText = typerText + singleChar;
        allText = allText + singleChar;
        if (mkSyntaxChars.includes(singleChar)) {
          curShowText = "";
        } else {
          curShowText = curShowText + singleChar;
          if (curShowText.length == 1) {
            const objTree = towxml(
              allText.substring(finishIndex),
              "markdown"
            );
            // console.log("当前finishIndex: ", finishIndex)
            // console.log("当前字符串：\n", allText.substring(finishIndex))
            // console.log("当前对象数据：", objTree.children)
            if (!flag) {
              flag = true
              _this.dataNodes = objTree.children
              _this.setData('dataNodes', objTree.children);
            } else {
              for (let i = 0; i < objTree.children.length; i++) {
                _this.dataNodes[oldFirstLevelChildNodes.length + i] = objTree.children[i]
                _this.setData({ [`dataNodes[${oldFirstLevelChildNodes.length + i}]`]: objTree.children[i] });
              }
              for (let x = oldFirstLevelChildNodes.length + objTree.children.length; x < _this.dataNodes.length; x++) {
                _this.setData({ [`dataNodes[${x}]`]: { tag: "unknow" } });
              }
            }

            const curNewNodesNum = towxml(
              allText.substring(finishIndex, allText.length - 1),
              "markdown"
            ).children.length;
            if (curNewNodesNum >= 2) {
              for (let i = 0; i < curNewNodesNum - 1; i++) {
                oldFirstLevelChildNodes.push(objTree.children[i])
              }
              let j = c;
              while (true) {
                const tmpNodes = towxml(
                  allText.substring(finishIndex, j),
                  "markdown"
                );
                if (tmpNodes.children.length <= curNewNodesNum - 1) {
                  finishIndex = j;
                  break;
                }
                j--;
              }
            }
          } else {
            if (textRenderCb.value && singleChar) {
              textRenderCb.value(singleChar, curShowText);
            }
          }
        }
      }, _this.data.speed);
    }
  },
})