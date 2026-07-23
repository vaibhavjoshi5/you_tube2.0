import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Copy,
  Circle,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";
import { backendUrl } from "@/lib/axiosinstance";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface VideoCallProps {
  initialRoom?: string;
}

export default function VideoCall({ initialRoom = "" }: VideoCallProps) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const socket = useRef<Socket | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordingCleanup = useRef<(() => void) | null>(null);
  const [roomId, setRoomId] = useState(initialRoom);
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (initialRoom) setRoomId(initialRoom);
  }, [initialRoom]);

  useEffect(
    () => () => {
      socket.current?.disconnect();
      peer.current?.close();
      localStream.current?.getTracks().forEach((track) => track.stop());
      recordingCleanup.current?.();
    },
    []
  );

  const createPeer = () => {
    if (peer.current) return peer.current;
    const connection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    localStream.current?.getTracks().forEach((track) => {
      connection.addTrack(track, localStream.current!);
    });
    connection.ontrack = (event) => {
      if (!remoteStream.current) remoteStream.current = new MediaStream();
      event.streams[0].getTracks().forEach((track) => {
        if (!remoteStream.current?.getTracks().some((item) => item.id === track.id)) {
          remoteStream.current?.addTrack(track);
        }
      });
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream.current;
      setConnected(true);
    };
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current?.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };
    connection.onconnectionstatechange = () => {
      setConnected(connection.connectionState === "connected");
    };
    peer.current = connection;
    return connection;
  };

  const joinCall = async () => {
    if (!roomId.trim()) {
      toast.error("Enter or create a room code");
      return;
    }

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideo.current) localVideo.current.srcObject = localStream.current;

      const client = io(backendUrl, { transports: ["websocket", "polling"] });
      socket.current = client;

      client.on("peer-joined", async () => {
        const connection = createPeer();
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        client.emit("webrtc-offer", { roomId, offer });
      });

      client.on("webrtc-offer", async ({ offer }) => {
        const connection = createPeer();
        await connection.setRemoteDescription(offer);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        client.emit("webrtc-answer", { roomId, answer });
      });

      client.on("webrtc-answer", async ({ answer }) => {
        await peer.current?.setRemoteDescription(answer);
      });

      client.on("ice-candidate", async ({ candidate }) => {
        if (candidate) await peer.current?.addIceCandidate(candidate);
      });

      client.on("peer-left", () => {
        setConnected(false);
        remoteStream.current = null;
        if (remoteVideo.current) remoteVideo.current.srcObject = null;
      });

      client.emit("join-room", roomId);
      setJoined(true);
    } catch (error) {
      console.error(error);
      toast.error("Camera and microphone permission are required");
    }
  };

  const leaveCall = () => {
    socket.current?.emit("leave-room", roomId);
    socket.current?.disconnect();
    peer.current?.close();
    localStream.current?.getTracks().forEach((track) => track.stop());
    remoteStream.current?.getTracks().forEach((track) => track.stop());
    peer.current = null;
    setJoined(false);
    setConnected(false);
  };

  const toggleAudio = () => {
    localStream.current?.getAudioTracks().forEach((track) => {
      track.enabled = muted;
    });
    setMuted((value) => !value);
  };

  const toggleVideo = () => {
    localStream.current?.getVideoTracks().forEach((track) => {
      track.enabled = cameraOff;
    });
    setCameraOff((value) => !value);
  };

  const shareYouTube = async () => {
    try {
      toast.info("Select the browser tab where YouTube is open");
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const screenTrack = display.getVideoTracks()[0];
      const sender = peer.current
        ?.getSenders()
        .find((item) => item.track?.kind === "video");
      await sender?.replaceTrack(screenTrack);
      if (localVideo.current) localVideo.current.srcObject = display;

      screenTrack.onended = async () => {
        const cameraTrack = localStream.current?.getVideoTracks()[0];
        if (cameraTrack) await sender?.replaceTrack(cameraTrack);
        if (localVideo.current) localVideo.current.srcObject = localStream.current;
      };
    } catch {
      toast.error("Screen sharing was cancelled");
    }
  };

  const createRecordingStream = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d")!;
    let frame = 0;

    const draw = () => {
      context.fillStyle = "#020617";
      context.fillRect(0, 0, canvas.width, canvas.height);
      if (remoteVideo.current?.readyState) {
        context.drawImage(remoteVideo.current, 0, 0, canvas.width, canvas.height);
      }
      if (localVideo.current?.readyState) {
        context.drawImage(localVideo.current, 940, 500, 320, 180);
      }
      frame = requestAnimationFrame(draw);
    };
    draw();

    const recordedStream = canvas.captureStream(30);
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    [localStream.current, remoteStream.current].forEach((stream) => {
      if (stream?.getAudioTracks().length) {
        audioContext.createMediaStreamSource(stream).connect(destination);
      }
    });
    destination.stream.getAudioTracks().forEach((track) => {
      recordedStream.addTrack(track);
    });

    recordingCleanup.current = () => {
      cancelAnimationFrame(frame);
      audioContext.close();
      recordedStream.getTracks().forEach((track) => track.stop());
    };
    return recordedStream;
  };

  const startRecording = async () => {
    try {
      const stream = await createRecordingStream();
      const selectedType = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9,opus"
      )
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      recorder.current = new MediaRecorder(stream, { mimeType: selectedType });
      chunks.current = [];
      recorder.current.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      recorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: selectedType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `yourtube-call-${roomId}-${Date.now()}.webm`;
        anchor.click();
        URL.revokeObjectURL(url);
        recordingCleanup.current?.();
      };
      recorder.current.start(1000);
      setRecording(true);
    } catch {
      toast.error("Call recording could not be started");
    }
  };

  const stopRecording = () => {
    recorder.current?.stop();
    setRecording(false);
  };

  const createRoom = () => {
    const code = crypto.randomUUID().slice(0, 8);
    setRoomId(code);
  };

  const copyInvite = async () => {
    const invite = `${window.location.origin}/calls?room=${roomId}`;
    await navigator.clipboard.writeText(invite);
    toast.success("Invite link copied");
  };

  return (
    <div className="space-y-5">
      {!joined && (
        <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border p-5 sm:flex-row">
          <Input
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Room code"
          />
          <Button variant="secondary" onClick={createRoom}>
            Create room
          </Button>
          <Button onClick={joinCall}>Join call</Button>
        </div>
      )}

      {joined && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
              <video ref={remoteVideo} autoPlay playsInline className="h-full w-full object-cover" />
              {!connected && (
                <div className="absolute inset-0 grid place-items-center text-sm text-white">
                  Waiting for your friend...
                </div>
              )}
            </div>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <video
                ref={localVideo}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" size="icon" onClick={toggleAudio}>
              {muted ? <MicOff /> : <Mic />}
            </Button>
            <Button variant="secondary" size="icon" onClick={toggleVideo}>
              {cameraOff ? <VideoOff /> : <Video />}
            </Button>
            <Button variant="secondary" onClick={shareYouTube}>
              <MonitorUp className="mr-2 h-4 w-4" />
              Share YouTube tab
            </Button>
            <Button
              variant={recording ? "destructive" : "secondary"}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? (
                <Square className="mr-2 h-4 w-4" />
              ) : (
                <Circle className="mr-2 h-4 w-4 fill-red-500 text-red-500" />
              )}
              {recording ? "Stop recording" : "Record call"}
            </Button>
            <Button variant="secondary" onClick={copyInvite}>
              <Copy className="mr-2 h-4 w-4" />
              Copy invite
            </Button>
            <Button variant="destructive" onClick={leaveCall}>
              <PhoneOff className="mr-2 h-4 w-4" />
              Leave
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
