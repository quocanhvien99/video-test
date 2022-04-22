import React, { useEffect, useRef } from 'react';
import * as Ion from 'ion-sdk-js/lib/connector';

interface Props {
	id: string;
	stream: Ion.LocalStream;
	muted: boolean;
}

export default function SmallVideoView(props: Props) {
	const videoRef = useRef<any>(null);

	useEffect(() => {
		//@ts-ignore
		videoRef.current.srcObject = props.stream;
		return () => {
			//@ts-ignore
			videoRef.current.srcObject = null;
		};
	}, []);

	// const handleClick = () => {
	// 	let { id, index } = props;
	// 	props.onClick({ id, index });
	// };

	const { id, stream, muted } = props;

	return (
		<div className="small-video-div">
			<video ref={videoRef} id={id} autoPlay playsInline muted={false} className="small-video-size" />
		</div>
	);
}
