window.enableAdapter = true; // enable adapter.js

            // ......................................................
            // .......................UI Code........................
            // ......................................................
            document.getElementById('open-room').onclick = function () {
                disableInputButtons();
                connection.open(document.getElementById('room-id').value, function () {
                    showRoomURL(connection.sessionid);
                });
            };

            document.getElementById('join-room').onclick = function () {
                disableInputButtons();

                connection.sdpConstraints.mandatory = {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                };
                connection.join(document.getElementById('room-id').value);
            };

            document.getElementById('open-or-join-room').onclick = function () {
                disableInputButtons();
                connection.openOrJoin(document.getElementById('room-id').value, function (isRoomExist, roomid) {
                    if (!isRoomExist) {
                        showRoomURL(roomid);
                    } else {
                        connection.sdpConstraints.mandatory = {
                            OfferToReceiveAudio: true,
                            OfferToReceiveVideo: true
                        };
                    }
                });
            };

            // ......................................................
            // ..................RTCMultiConnection Code.............
            // ......................................................

            var connection = new RTCMultiConnection();

            // by default, socket.io server is assumed to be deployed on your own URL
            connection.socketURL = '/';

            // comment-out below line if you do not have your own socket.io server
            // connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

            connection.socketMessageEvent = 'video-broadcast-demo';

            connection.session = {
                audio: true,
                video: true,
                oneway: true
            };

            connection.sdpConstraints.mandatory = {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false
            };

            connection.videosContainer = document.getElementById('videos-container');
            connection.onstream = function (event) {
                event.mediaElement.removeAttribute('src');
                event.mediaElement.removeAttribute('srcObject');

                var video = document.createElement('video');
                video.controls = true;
                if (event.type === 'local') {
                    video.muted = true;
                }
                video.srcObject = event.stream;

                var width = parseInt(connection.videosContainer.clientWidth / 2) - 20;
                var mediaElement = getHTMLMediaElement(video, {
                    title: event.userid,
                    buttons: ['full-screen'],
                    width: width,
                    showOnMouseEnter: false
                });

                connection.videosContainer.appendChild(mediaElement);

                setTimeout(function () {
                    mediaElement.media.play();
                }, 5000);

                mediaElement.id = event.streamid;
            };

            connection.onstreamended = function (event) {
                var mediaElement = document.getElementById(event.streamid);
                if (mediaElement) {
                    mediaElement.parentNode.removeChild(mediaElement);
                }
            };

            function disableInputButtons() {
                document.getElementById('open-or-join-room').style.display = 'none';;
                document.getElementById('open-room').style.display = 'none';
                document.getElementById('join-room').style.display = 'none';
                document.getElementById('room-id').style.display = 'none';
            }

            // ......................................................
            // ......................Handling Room-ID................
            // ......................................................

            function showRoomURL(roomid) {
                var roomHashURL = '#' + roomid;
                var roomQueryStringURL = '?roomid=' + roomid;

                var html = '<h2>Sala Creada:</h2><br>';

                html += 'URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
                html += '<br>';
                html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL +
                    '</a>';

                var roomURLsDiv = document.getElementById('room-urls');
                roomURLsDiv.innerHTML = html;

                roomURLsDiv.style.display = 'block';
            }

            (function () {
                var params = {},
                    r = /([^&=]+)=?([^&]*)/g;

                function d(s) {
                    return decodeURIComponent(s.replace(/\+/g, ' '));
                }
                var match, search = window.location.search;
                while (match = r.exec(search.substring(1)))
                    params[d(match[1])] = d(match[2]);
                window.params = params;
            })();

            var roomid = '';
            if (localStorage.getItem(connection.socketMessageEvent)) {
                roomid = localStorage.getItem(connection.socketMessageEvent);
            } else {
                roomid = connection.token();
            }
            document.getElementById('room-id').value = roomid;
            document.getElementById('room-id').onkeyup = function () {
                localStorage.setItem(connection.socketMessageEvent, this.value);
            };

            var hashString = location.hash.replace('#', '');
            if (hashString.length && hashString.indexOf('comment-') == 0) {
                hashString = '';
            }

            var roomid = params.roomid;
            if (!roomid && hashString.length) {
                roomid = hashString;
            }

            if (roomid && roomid.length) {
                document.getElementById('room-id').value = roomid;
                localStorage.setItem(connection.socketMessageEvent, roomid);

                // auto-join-room
                (function reCheckRoomPresence() {
                    connection.checkPresence(roomid, function (isRoomExist) {
                        if (isRoomExist) {
                            connection.sdpConstraints.mandatory = {
                                OfferToReceiveAudio: true,
                                OfferToReceiveVideo: true
                            };
                            connection.join(roomid);
                            return;
                        }

                        setTimeout(reCheckRoomPresence, 5000);
                    });
                })();

                disableInputButtons();
            }