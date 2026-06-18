import upiLink from "../assets/payment.png";

const fallbackUpiId = "8972089184@pthdfc";

export default function PaymentPage({ tournament }) {
  const upiId = tournament?.upiId || fallbackUpiId;
  const qrImage = tournament?.paymentQr || upiLink;

  const copyUpiId = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(upiId);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-gray-950/70 p-4 text-white">
      <h2 className="text-xl font-bold text-yellow-200">UPI Payment</h2>
      <p className="mt-2 text-sm text-gray-300">
        Pay using this tournament UPI QR/ID and attach the successful payment screenshot in the form.
      </p>
      <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm">
        <p className="text-gray-400">UPI ID</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="break-all font-semibold text-white">{upiId}</span>
          <button
            type="button"
            onClick={copyUpiId}
            className="rounded-md bg-white/10 px-2 py-1 text-xs text-yellow-100 hover:bg-white/15"
          >
            Copy
          </button>
        </div>
      </div>
      <img
        src={qrImage}
        className="mx-auto mt-4 aspect-square w-full max-w-52 rounded-lg bg-white object-contain p-3"
        alt="UPI QR"
      />
    </div>
  );
}
