export default function MediaCard({ media }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md bg-white hover:scale-[1.02] transition">
      {media.type === "image" ? (
        <img
          src={media.url}
          alt="Tournament glimpse"
          loading="lazy"   // ✅ Lazy Loading
          className="w-full h-56 object-cover"
        />
      ) : (
        <video
          src={media.url}
          controls
          preload="none"   // ✅ Lazy load video
          className="w-full h-56 object-cover"
        />
      )}
    </div>
  );
}
