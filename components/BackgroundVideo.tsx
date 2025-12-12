export default function BackgroundVideo() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      <div className="absolute inset-0 bg-black/40 z-10" />
      <video
        autoPlay
        muted
        loop
        playsInline
        className="object-cover w-full h-full"
      >
        <source src="/main.mp4" type="video/mp4" />
        <source src="/main.webm" type="video/webm" />
      </video>
    </div>
  );
}
