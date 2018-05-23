var url;
var articleRef;
var article_id;
chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
  url = tabs[0].url;
  // console.log('tabs[0]: ',tabs[0]);
  // console.log('url:', url);
  article_id = url.split('/')[5];
  articleRef = firebase.database().ref(article_id);
  // get database data
  articleRef.on('value', function(snap){
    content.innerHTML = '';
    const val = snap.val();
    //console.log('val:', val);
    loading.classList.toggle('hide');
    for(let key in val) {
      //console.log(val[key]);
      let block = document.createElement('div');
      block.setAttribute('class', 'msg');
      let item = val[key];
      block.innerHTML = `<span>${item.name}</span><p title='${item.time}'>${item.message}</p>`;
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


chrome.storage.sync.get(['name'], function(result) {
  // console.log('Value currently is ' + result.name);
  if(Boolean(result.name))
    nameInput.value = result.name;
});

sendButton.addEventListener('click', function(e){
  let name = nameInput.value;
  let inputMessage = input.value;
  // console.log('article_id: ', article_id);
  // console.log('name: ', name);
  // console.log('inputMessage: ', inputMessage);
  if(name.length === 0 && inputMessage.length !== 0){
    nameInput.focus();
    alert('who are you??');
    e.preventDefault();
    return false;
  }
  if(inputMessage.length === 0){      
    e.preventDefault();
    return false;
  }
  articleRef.push({
    name: name,
    message: inputMessage,
    time: getTime()
  });
  input.value = '';
  chrome.storage.sync.set({name: name}, function() {
    console.log('Value is set to ' + name);
  });
});

function getTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const month = now.getMonth()+1;
  const date = now.getDate();
  const year = now.getFullYear();
  const second = now.getSeconds();
  return `${year}/${month}/${date}-${hours}:${minutes}:${second}`;
}