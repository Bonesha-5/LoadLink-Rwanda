const TRUCK_IMAGES = ['/cargo.jpg', '/cargo1.avif', '/hero.jpg']

export default function Trucks() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-6">
      <div className="trucks-image-stack">
        {TRUCK_IMAGES.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
    </div>
  )
}
