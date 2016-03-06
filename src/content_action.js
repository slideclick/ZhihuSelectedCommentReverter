(function() {
  MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  var getTimeFromComment = function(commentElem) {
    return $(commentElem).find("time").attr("title");
  }  // getTimeFromComment

  var info;
  (function() {
    info = $("<li></li>");
    var currentVersion = chrome.runtime.getManifest().version;
    var updater = $("<span><a href='#'>检查更新</a></span>");
    updater.children('a').click(function() {
      var githubRaw = "https://raw.githubusercontent.com/swgr424/ZhihuSelectedCommentReverter";
      var manifestUrl = githubRaw + "/master/src/manifest.json";
      var crxUrl = githubRaw + "/master/ZhihuSelectedCommentReverter.crx";
      var spinner = $("<div style='position:relative; display:inline-block; width:20pt'>&nbsp;</div>");
      updater.empty().append(spinner);
      spinner.spin({scale: 0.4, top: '50%', left: '50%'});
      $.getJSON(manifestUrl, function(data) {
        spinner.spin(false);
        if (data.version > currentVersion) {
          updater.empty().append($("<a href='" + crxUrl + "'>下载新版(v" + data.version + ")  </a>"));
        } else {
          updater.empty().append($("<html>当前已最新</html>"));
        }
      });
      return false;
    });
    info.append($("<a href='http://zhuanlan.zhihu.com/swgr6/20612507' target='_blank'>知乎精选评论还原器</a>"));
    info.append($("<html> v"  + currentVersion + " | </html>"));
    info.append(updater);
  })();  // info initializer

  var listener = function(mutations, observer) {
    for (var i = 0; i < mutations.length; ++i) {
      var mutation = $(mutations[i].target);
      var infoPlaceholder = $("li#restorerInfo");
      if (infoPlaceholder.length > 0) {
        infoPlaceholder.replaceWith(info);
        continue;
      }
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
      }  // refresh

      restorer.click(function() {
        commentPanel[0].selectedState = !commentPanel[0].selectedState;
        refresh();
        return false;
      });  // click

      commentPanel.find("span[class*='CommentBox_dividerText']").append(restorer);
      var tip = commentPanel.find("span[class*='CommentBox_dividerText'] i");
      var tipNode = $("<div>" + tip.attr("data-tip") + "</div>");
      tipNode.find("ul").append($("<li id='restorerInfo'>placeholder</li>"));
      tip.attr("data-tip", tipNode.html());

      if (!commentPanel[0].hasOwnProperty("selectedState")) {
        commentPanel[0].selectedState = true;
      }
      refresh();

      break;
    }
  }  // listener

  var observer = new MutationObserver(listener);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
