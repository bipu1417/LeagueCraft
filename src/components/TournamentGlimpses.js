import MediaCard from "./MediaCard";

const mediaList = [
  { id: 1, type: "image", url: "/media/img1.jpg" },
  { id: 2, type: "video", url: "/media/video1.mp4" },
  { id: 3, type: "image", url: "/media/img2.jpg" },
  // 🔗 Replace with backend API data
];

export default function TournamentGlimpses() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-semibold mb-8 text-center">
        Tournament Glimpses
      </h2>

      <div className="
        grid gap-6
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
      ">
        {mediaList.map((media) => (
          <MediaCard key={media.id} media={media} />
        ))}
      </div>
    </div>
  );
}
