
var cacheNameOld = 'wittr-static-v1';
var staticCacheName = 'wittr-static-v4';

//laslslsal
self.addEventListener('install', function(event)
{
	
	var cacheName = 'wittr-static-v2';

	var urlsToCache = [
    '/skeleton',
    'js/main.js',
    'css/main.css',
    'imgs/icon.png',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
  ];

	

	event.waitUntil(
		// TO DO open a cach named  'wittr-static-v1'
		//Add cach the urls from the urlsToCach var
		caches.open(staticCacheName).then(function(cache){
		

			return cache.addAll(urlsToCache);

				


			})

		);

});



self.addEventListener('activate', function(event) {
  
	console.log('[SW activate event] ran');

  event.waitUntil(
    // TODO: remove the old cache
    
    caches.keys().then(function(cacheNames)
    {
    	return Promise.all(
    		cacheNames.filter(function(cacheName){
    		return cacheName.startsWith('wittr-') && cacheName != staticCacheName;
    		}).map(function(cacheName){
    			return caches.delete(cacheName);
    		})
    	);	

    })


  );
});


self.addEventListener('fetch', function(event){
	
	var requestURL = new URL(event.request.url);

	if (requestURL.origin === location.origin) 
	{
		if (requestURL.pathname === '/')
		{
			event.respondWith(caches.match('/skeleton'));
		}
	}

	event.respondWith(

		caches.match(event.request).then(function(response){
			if (response) 
				return response;
			
			return fetch(event.request);

		})

		);
	
	});


self.addEventListener('message', function(event){
	if (event.data.action === 'skipWaiting')
	{
		self.skipWaiting();
	}
});

