import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

export default function IndexController(container) {
  this._container = container;
  this._postsView = new PostsView(this._container);   //postsView updates posts 
  this._toastsView = new ToastsView(this._container); //toastsView helps display error messages 
  this._lostConnectionToast = null;
  this._openSocket();                                 //open a (new) socket connection
  this._registerServiceWorker();

}


IndexController.prototype._registerServiceWorker = function()
{
  //TODO: register service worker
   
  if (!navigator.serviceWorker) 
    {
      return;

    }
    var indexController = this;
  navigator.serviceWorker.register('/sw.js').then(function(reg){
     if (!navigator.serviceWorker.controller) 
    {
      return;
    }   

    // TODO: if there's an updated worker already waiting, call
    // indexController._updateReady()

    if (reg.waiting)
    {
      indexController._updateReady(reg.waiting);
      return;
    }
    

    // TODO: if there's an updated worker installing, track its
    // progress. If it becomes "installed", call
    // indexController._updateReady()

    if (reg.installing)
    {
      indexController._trackInstalling(reg.installing);
      return;
    }


    // TODO: otherwise, listen for new installing workers arriving.
    // If one arrives, track its progress.
    // If it becomes "installed", call
    // indexController._updateReady()

    indexController._updateReady(reg.activated);
          reg.addEventListener('updatefound', function(){
          indexController._trackInstalling(reg.installing);
          
          })
    

    navigator.serviceWorker.addEventListener('controllerchange', function()
    {
      window.location.reload();
    })


      console.log('Registration worked');
    }).catch(function(){console.log('Registration failed');});

}

var worker = navigator.serviceWorker;

IndexController.prototype._trackInstalling = function(worker)
{
  var indexController = this;

  worker.addEventListener('statechange', function(){
    if (worker.state == 'installed')
    {
      indexController._updateReady(worker);
    }
  })
}

IndexController.prototype._updateReady = function(worker)
{
   var indexController = this;
   var toast = this._toastsView.show("New version available", {
    buttons: ['refresh', 'dismiss']
  });

  toast.answer.then(function(answer) {
    if (answer != 'refresh') return;
    worker.postMessage({ action: 'skipWaiting' });
  });
};

// open a connection to the server for live updates
IndexController.prototype._openSocket = function() {    //Opens web socket
  var indexController = this;
  var latestPostDate = this._postsView.getLatestPostDate();

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location); 
  socketUrl.protocol = 'ws';

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf();
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1);

  var ws = new WebSocket(socketUrl.href);

  // add listeners
  ws.addEventListener('open', function() {
    if (indexController._lostConnectionToast) {
      indexController._lostConnectionToast.hide();
    }
  });

  ws.addEventListener('message', function(event) {
    requestAnimationFrame(function() {
      indexController._onSocketMessage(event.data); //When a post is recieved _onSocketMessage is called
    });
  });

  ws.addEventListener('close', function() {
    // tell the user
    if (!indexController._lostConnectionToast) {
      indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…");
    }

    // try and reconnect in 5 seconds
    setTimeout(function() {
      indexController._openSocket();
    }, 5000);
  });
};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function(data) {
  var messages = JSON.parse(data);
  this._postsView.addPosts(messages);
};