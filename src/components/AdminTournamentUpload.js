import { useState } from "react";
import { AlertModal } from "./ui/AppModal";

export default function AdminTournamentUpload() {
  const [files, setFiles] = useState([]);
  const [alert, setAlert] = useState(null);

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = () => {
    setAlert({
      title: "Upload ready",
      message: `${files.length} file${files.length === 1 ? "" : "s"} selected. Connect this action to Firebase Storage or your backend to complete media publishing.`,
      tone: "info",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Upload Tournament Media
      </h2>

      <div className="bg-white shadow-lg rounded-2xl p-6 space-y-4">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="block w-full text-sm
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:bg-black file:text-white
          hover:file:bg-gray-800"
        />

        <button
          onClick={handleUpload}
          className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition"
        >
          Upload Media
        </button>

        <p className="text-gray-500 text-sm">
          Supported: JPG, PNG, MP4, MOV
        </p>
      </div>
      <AlertModal
        open={Boolean(alert)}
        title={alert?.title}
        message={alert?.message}
        tone={alert?.tone}
        onClose={() => setAlert(null)}
      />
    </div>
  );
}
