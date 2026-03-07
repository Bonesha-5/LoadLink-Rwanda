type LoadCardProps = {
  origin: string
  destination: string
  date: string
  price: string
}

export default function LoadCard(props: LoadCardProps) {
  const { origin, destination, date, price } = props
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="font-semibold text-stone-800">{origin} → {destination}</p>
      <p className="text-sm text-stone-600 mt-1">Date: {date}</p>
      <p className="text-accent font-semibold mt-2">{price}</p>
    </div>
  )
}
