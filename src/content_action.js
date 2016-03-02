(function() {
  MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  var getTimeFromComment = function(commentElem) {
    return $(commentElem).find("time").attr("title");
  }  // getTimeFromComment
  
  var listener = function(mutations, observer, start, stop) {
    for (var i = 0; i < mutations.length; ++i) {
      var mutation = $(mutations[i].target);
      // Find the comment panel contains current mutation.
      var commentPanel = $("div.zm-item-comment-el").filter(function(idx, elem) {
        return $(elem).find(mutation).length == 1;
      });
      var divider = commentPanel.find("div[class*='CommentBox_divider']");
      if (!divider[0]) continue;
      if (divider[0].injected) break;
      divider[0].injected = true;
      
      // Separate selected/normal comments into two arrays.
      var selectedCommentElems = [];
      var normalCommentElems = [];
      (function() {
        var commentBox = commentPanel.find("div[class*='CommentBox_list']");
        var commentsAndDivider = commentBox.children();
        var pastDivider = false;
        commentsAndDivider.each(function(idx, elem) {
          if (elem == divider[0]) {
            pastDivider = true;
          } else if (!pastDivider) {
            selectedCommentElems.push(elem);
          } else {
            normalCommentElems.push(elem);
          }
        });
      })();
      
      var mergeArray = function(arr1, arr2, getFeature) {
        if (arr1.length == 0) return arr2;
        if (arr2.length == 0) return arr1;
        if (getFeature(arr1[0]) <= getFeature(arr2[0])) {
          return [arr1[0]].concat(mergeArray(arr1.slice(1), arr2, getFeature));
        } else {
          return [arr2[0]].concat(mergeArray(arr1, arr2.slice(1), getFeature));
        }
      }  // mergeArray
      
      // The injected button and its event logic.
      var restorer = $("<a href='#' class='meta-item'>restorer</a>");
      var refresh = function() {
        stop();
        if (!commentPanel[0].selectedState) {
          selectedCommentElems.forEach(function(elem) {
            elem.originalBgcolor = $(elem).css("background-color");
            $(elem).css("background-color", "#f5fff5");
          });
          $(mergeArray(selectedCommentElems, normalCommentElems, getTimeFromComment)).insertAfter(divider);
        } else {
          selectedCommentElems.forEach(function(elem) {
            $(elem).css("background-color", elem.originalBgcolor);
          });
          $(selectedCommentElems).insertBefore(divider);
        }
        restorer.text(commentPanel[0].selectedState ? "内嵌" : "收集");
        start();
      }  // refresh
      
      restorer.click(function() {
        commentPanel[0].selectedState = !commentPanel[0].selectedState;
        refresh();
        return false;
      });  // click
      
      stop();
      restorer.appendTo(commentPanel.find("span[class*='CommentBox_dividerText']"));
      var tip = commentPanel.find("span[class*='CommentBox_dividerText'] i");
      var tipHtml = tip.attr("data-tip");
      var tipNode = $("<div>" + tipHtml + "</div>");
      console.log(chrome.runtime.getManifest());
      $("<li>『<a href='http://zhuanlan.zhihu.com/swgr6/20612507' target='_blank'>知乎精选评论还原器</a>』版本："  + chrome.runtime.getManifest().version + " | <a href='https://github.com/swgr424/ZhihuSelectedCommentReverter' target='_blank'>检查更新</a></li>").appendTo(tipNode.find("ul"));
      tip.attr("data-tip", tipNode.html());
      
      start();
      if (!commentPanel[0].hasOwnProperty("selectedState")) {
        commentPanel[0].selectedState = true;
      }
      refresh();

      break;
    }
  }  // listener

  var start, stop;
  var observer = new MutationObserver(function(m, o) { listener(m, o, start, stop); });
  start = function() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  stop = function() { observer.disconnect(); }
  start();
})();

console.log("init done.");