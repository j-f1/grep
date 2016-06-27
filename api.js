// requires:
// http://cdnjs.cloudflare.com/ajax/libs/jszip/3.0.0/jszip.min.js
// http://cdn.rawgit.com/Stuk/jszip-utils/dfdd631c4249bc495d0c335727ee547702812aa5/dist/jszip-utils.min.js
// http://cdn.rawgit.com/Stuk/jszip-utils/dfdd631c4249bc495d0c335727ee547702812aa5/dist/jszip-utils-ie.min.js IF IE 6-9
// http://cdn.rawgit.com/paroga/cbor-js/dca0855fd71ee9e480881e6e1bccce6591ffa67b/cbor.js

window.findWords = function(regex, full, callback) {
  var i;
  if (!findWords.words) {
    if (localStorage.words && !shouldReload()) {
      var words = CBOR.decode(_base64ToArrayBuffer(localStorage.words));
      for (i = 0; i < words.length; i++) {
        words[i] = uintToString(words[i]);
      }
      findWords.words = words;
    } else {
      JSZipUtils.getBinaryContent('//twopointzero.us/code/grep/words.cbor.zip', function(err, data) {
        if(err) {
          if (localStorage.words) {
            findWords.words = CBOR.decode(_base64ToArrayBuffer(localStorage.words));
            findWords(regex, full, callback);
            return;
          } else {
            throw err;
          }
        }
        var zip = new JSZip();
        zip.loadAsync(data).then(function() {
          var file = zip.file('words.cbor');
          file.async("arraybuffer").then(function(cborData) {
            try {
              var words = CBOR.decode(cborData);
              for (var i = 0; i < words.length; i++) {
                words[i] = uintToString(words[i]);
              }
              findWords.words = words;
              // from http://stackoverflow.com/q/9267899/5244995#comment55137593_11562550
              localStorage.words = btoa([].reduce.call(new Uint8Array(CBOR.encode(words)),function(p,c){return p+String.fromCharCode(c);},''));
              findWords(regex, full, callback);
            } catch (e) {
              console.error(e);
            }
          }, function(err) {
            console.error(err);
          });
        });
      });
      return;
    }
  } else {
/* To require slashes around the regex, but allow flags: (SOURCE: http://stackoverflow.com/a/874742/5244995)
var match = regex.match(new RegExp('^/(.*?)/([gimy]*)$'));
var regex = new RegExp(match[1], match[2]); */
    if (!regex) {
      callback([], regex);
      return false;
    }
    if (full) {
      regex = "^"+regex+"$";
    }
    regex = new RegExp(regex);
    var matches = [],
        tooMany = false;
    for (i = 0; i < findWords.words.length; i++) {
      var word = findWords.words[i];
      if (regex.test(word)) {
        matches.push(word);
      }
      if (matches.length >= 8000) {
        tooMany = true;
        break;
      }
    }
    callback(matches, regex, tooMany);
  }
};

window.findWords = window.findWords.bind(window.findWords);
