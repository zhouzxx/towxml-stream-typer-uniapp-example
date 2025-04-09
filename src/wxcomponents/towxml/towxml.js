//markdown语法特殊字符
const mkSyntaxChars = [
  "#",
  "*",
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
        const singleChar = _this.data.mdText[c];
        c++;
        if (singleChar == undefined) {
          return
        }
        typerText = typerText + singleChar;
        allText = allText + singleChar;
        if (mkSyntaxChars.includes(singleChar) || singleChar.match( /\r?\n/g)) {
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
                //通过路径的方式，一个个元素地渲染，比直接_this.setData(dataNodes,数组)的方式，效率提高很多
                _this.setData({ [`dataNodes[${oldFirstLevelChildNodes.length + i}]`]: objTree.children[i] });
              }
              //上一次可能渲染了多余的节点，这次要去掉
              for (let x = oldFirstLevelChildNodes.length + objTree.children.length; x < _this.dataNodes.length; x++) {
                _this.setData({ [`dataNodes[${x}]`]: { tag: "unknow" } });
              }
            }
            //以下是判断是否可以复用的逻辑，复用的条件就是：当最新的内容转化出来有n个节点，那么只有第n个是可能不完整的，前n-1个是可以复用的
            //allText.substring(finishIndex, allText.length - 1)截至是 allText.length - 1而不是allText.length，是为了避免1. 2.这种有序列表情况触发的问题，因为1，2不是markdown特殊语法字符，但是1. 却是
            const curNewNodes = towxml(
              allText.substring(finishIndex, allText.length - 1),
              "markdown"
            )
            const curNewNodesNum = Math.min(curNewNodes.children.length, objTree.children.length);
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
                //allText[j - 1].match( /\r?\n/g) 这句话也是为了避免1. 2.这种有序列表情况触发的问题
                if (tmpNodes.children.length <= curNewNodesNum - 1 && allText[j - 1] && allText[j - 1].match( /\r?\n/g)) {
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
