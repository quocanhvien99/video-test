import React, { FormEventHandler, LegacyRef, useRef, useState } from 'react';
import * as Ion from 'ion-sdk-js/lib/connector';
import './App.css';
import { v4 as uuidv4 } from 'uuid';
import SmallVideoView from './videoview/SmallVideoView';

function App() {
	const [room, setRoom] = useState<Ion.Room | null>(null);
	const [rtc, setRTC] = useState<Ion.RTC | null>(null);
	const [sid, setSid] = useState<string>('');
	const [uid, setUid] = useState<string>(uuidv4());
	const [uname, setUname] = useState<string>('');
	const [isLogin, setIsLogin] = useState<boolean>(false);
	const [peers, setPeers] = useState<any>([]);
	const [localStream, setLocalStream] = useState<Ion.LocalStream | null>(null);

	const handleJoin: FormEventHandler = (e) => {
		e.preventDefault();

		let url = window.location.protocol + '//' + window.location.hostname + ':' + '5551';
		let connector = new Ion.Connector(url, 'token');

		let room = new Ion.Room(connector);
		let rtc = new Ion.RTC(connector);
		setRoom(room);
		setRTC(rtc);

		room.onjoin = (result) => console.log('onjoin: success=', result.success);
		room.onleave = (reason) => console.log('onleave: ', reason);
		room.onpeerevent = (ev) => {
			if (ev.state === Ion.PeerState.JOIN) {
				console.log('Peer Join', 'peer => ' + ev.peer.displayname + ', join!');
			} else if (ev.state === Ion.PeerState.LEAVE) {
				console.log('Peer Leave', 'peer => ' + ev.peer.displayname + ', leave!');
			}
		};
		room
			.join(
				{
					sid: sid,
					uid: uid,
					displayname: uname,
					extrainfo: '',
					destination: 'webrtc://ion/peer1',
					role: Ion.Role.HOST,
					protocol: Ion.Protocol.WEBRTC,
					avatar: 'string',
					direction: Ion.Direction.INCOMING,
					vendor: 'string',
				},
				''
			)
			.then((result) => {
				console.log('[join] result: success ' + result!.success + ', room info: ' + result!.room);
				setIsLogin(true);

				if (!result!.success) {
					console.log('[join] failed: ' + result!.error.reason);
					return;
				}

				rtc.ontrackevent = function(ev) {
					console.log(
						'[ontrackevent]: \nuid = ',
						ev.uid,
						' \nstate = ',
						ev.state,
						', \ntracks = ',
						JSON.stringify(ev.tracks)
					);
					let _peers = peers;
					_peers.forEach((item: any) => {
						ev.tracks.forEach((track) => {
							if (item.uid === ev.uid && track.kind === 'video') {
								console.log('track=', track);
								// item["id"] = JSON.stringify(ev.tracks)[0].id;
								item['id'] = track.stream_id;
								console.log('ev.streams[0].id:::' + item['id']);
							}
						});
					});

					setPeers([..._peers]);
				};

				rtc.ontrack = (track, stream) => {
					console.log('got track', track.id, 'for stream', stream.id);
					if (track.kind === 'video') {
						track.onunmute = () => {
							let found = false;
							peers.forEach((peer: any) => {
								if (stream.id === peer.id) {
									found = true;
								}
							});

							if (!found) {
								setTimeout(() => {
									console.log('stream.id:::' + stream.id);
									let name = 'Guest';
									console.log('peers=', peers, 'stream=', stream);
									let _peers = peers;
									_peers = _peers.map((peer: any) => {
										if (peer['id'] === stream.id) {
											name = peer.name;
											peer.stream = stream;
										}
										return peer;
									});

									setPeers(_peers);

									stream.onremovetrack = () => {
										_peers = _peers.filter((peer: any) => peer.id !== stream.id);
										setPeers(_peers);
									};
								}, 200);
							}
						};

						track.onmute = () => {
							console.log('onmute:::' + stream.id);
						};
					}
				};

				rtc.connect();
				rtc.join(sid, uid, undefined);
				console.log('rtc.join');

				setTimeout(() => {
					Ion.LocalStream.getUserMedia({
						codec: 'vp8',
						resolution: 'vga',
						audio: true,
						video: true,
						simulcast: true,
					})
						.then((media) => {
							console.log('rtc.publish media=', media);
							rtc.publish(media);
							setLocalStream(media);
						})
						.catch((e) => {
							console.log('handleLocalStream error => ' + e);
						});
				}, 200);
			});
	};

	return (
		<div className="App">
			{!isLogin ? (
				<form onSubmit={handleJoin}>
					<label htmlFor="room">Room:</label>
					<input type="text" id="room" onChange={(e) => setSid(e.currentTarget.value)} />
					<label htmlFor="username">Username:</label>
					<input type="text" id="username" onChange={(e) => setUname(e.currentTarget.value)} />
					<button>Join</button>
				</form>
			) : (
				<>{localStream && <SmallVideoView id={localStream.id} muted={false} stream={localStream} />}</>
			)}
		</div>
	);
}

export default App;
