import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: {
    id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    attendees?: number;
    maxAttendees?: number;
  };
  onViewDetails?: (eventId: number) => void;
}

export default function EventCard({ event, onViewDetails }: EventCardProps) {
  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();
  
  return (
    <li className="py-3">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 bg-accent text-white rounded-lg w-12 h-12 flex flex-col items-center justify-center">
          <span className="text-xs font-medium">{month}</span>
          <span className="text-lg font-bold">{day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{event.title}</p>
          <p className="text-xs text-gray-500">{`${event.startTime} - ${event.endTime}`}</p>
          <div className="mt-1 flex items-center">
            {event.attendees !== undefined && (
              <span className="text-xs text-gray-500">
                {event.attendees} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''} people signed up
              </span>
            )}
            <Button 
              variant="link" 
              className="ml-auto p-0 h-auto text-xs text-primary" 
              onClick={() => onViewDetails?.(event.id)}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
