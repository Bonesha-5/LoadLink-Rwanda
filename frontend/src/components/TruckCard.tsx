type TruckCardProps = {
  capacity: string
  location: string
  owner: string
}

export default function TruckCard(props: TruckCardProps) {
  return (
    <div className="truck-card">
      <p>Capacity: {props.capacity}</p>
      <p>Location: {props.location}</p>
      <p>Owner: {props.owner}</p>
    </div>
  )
}
