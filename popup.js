var url;
var articleRef;
var article_id;
var storageRef;
chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
  url = tabs[0].url;
  // console.log('tabs[0]: ',tabs[0]);
  // console.log('url:', url);
  article_id = url.split('/')[5];
  articleRef = firebase.database().ref(article_id);
  storageRef = firebase.storage().ref("/file/");
  // get database data
  articleRef.on('value', function(snap){
    content.innerHTML = '';
    const val = snap.val();
    //console.log('val:', val);
    loading.classList.toggle('hide');
    for(let key in val) {
      //console.log(val[key]);
      let block = document.createElement('div');
      let item = val[key];
      block.setAttribute('class', 'msg');
      if (Boolean(item.type) === false || item.type === 'text') {
        block.innerHTML = `<span>${item.name}</span><p title='${item.time}'>${item.message}</p>`;
      } else if (item.type === 'image') {
        block.innerHTML = `<span>${item.name}</span><img src="${item.message}" title='${item.time}'>`;
      } else if (item.type === 'file') {
        block.innerHTML = `<span>${item.name}</span><p title='${item.time}'><a href="${item.message}" target='_blank'>${item.filename}</a></p>`;
      }
      content.appendChild(block);
    }
    content.scrollTop = content.scrollHeight;
  });
  
});

// get DOM
let content = document.getElementById('content');
let input = document.getElementById('input');
let sendButton = document.getElementById('sendButton');
let nameInput = document.getElementById('name');
let loading = document.getElementById('loading');
let uploadInput = document.getElementById('upload');
let progressNumber = document.getElementById('prograssNumber');


chrome.storage.sync.get(['name'], function(result) {
  if(Boolean(result.name))
    nameInput.value = result.name;
});

sendButton.addEventListener('click', function(e){
  let name = nameInput.value;
  let inputMessage = input.value;
  if(name.length === 0 && inputMessage.length !== 0){
    alert('who are you??');
    nameInput.focus();
    e.preventDefault();
    return false;
  }
  if(inputMessage.length === 0){      
    e.preventDefault();
    return false;
  }
  articleRef.push({
    name: name,
    type: 'text',
    message: inputMessage,
    time: getTime()
  });
  input.value = '';
  chrome.storage.sync.set({name: name}, function () {
    console.log('Value is set to ' + name);
  });
});

uploadInput.addEventListener('click', function (e) {
  console.log('click upload img');
  if (nameInput.value.length === 0) {
    alert('who are you?');
    e.preventDefault(); // 沒輸入名字，就結束，不要跳出檔案選擇器
    return false;
  }
});

uploadInput.addEventListener('change', function (e) {
  console.log('onchange');
  console.log(e);
  const file = e.target.files[0];
  const size = file.size / 1024 / 1024;
  if (size > 10) {
    // 10MB 的大小限制
    alert(`${size.toFixed(2)}MB 太大了啦，想辦法弄小一點，或用其他方式傳`);
    e.preventDefault();
    return false;
  }
  const filename = Date.now() + `_${file.name}`;
  const metadata = {
    contentType: 'file/*'
  };
  const prograssBar = document.getElementById('prograssBar');
  const uploadTask = storageRef.child(filename).put(file, metadata);
  // upload status
  uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, 
    // 上傳進度
    function (snap) {
      progressNumber.style.display = 'inherit';
      let progress = Math.floor((snap.bytesTransferred / snap.totalBytes) * 100);
      if (progress < 100) {
        progressNumber.innerText = `uploading... ${progress}%`;
      }
    },
    // 錯誤處理
    function (error) {
      console.log('error', error);
    },
    // 結束處理
    function () {
      uploadTask.snapshot.ref.getDownloadURL()
      .then( (url) => {
        articleRef.push({
          name: nameInput.value,
          type: 'file',
          message: url,
          filename: file.name,
          time: getTime()
        });
      });
      progressNumber.style.display = 'none';
    }
  );
});

function getTime() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const month = now.getMonth()+1;
  const date = now.getDate();
  const year = now.getFullYear();
  const second = now.getSeconds();
  return `${year}/${month<10?'0'+month:month}/${date<10?'0'+date:date}-${hour<10?'0'+hour:hour}:${minute<10?'0'+minute:minute}:${second<10?'0'+second:second}`;
}