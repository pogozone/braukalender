import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, startOfYear } from 'date-fns';
import de from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MiniCalendar = ({ events, currentDate, title }) => {
  return (
    <div className="mini-calendar mb-3">
      <h6 className="text-center mb-2">{title}</h6>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultDate={currentDate}
        defaultView="month"
        views={['month']}
        toolbar={false}
        style={{ height: '200px', fontSize: '10px' }}
        messages={{
          next: "",
          previous: "",
          today: "",
          month: "",
          week: "",
          day: "",
          agenda: "",
          date: "",
          time: "",
          event: "",
          noEventsInRange: ""
        }}
      />
    </div>
  );
};

const YearView = ({ events, currentDate }) => {
  const yearStart = startOfYear(currentDate);
  const months = [];
  
  for (let i = 0; i < 12; i++) {
    const monthDate = addMonths(yearStart, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (eventStart <= monthEnd && eventEnd >= monthStart);
    });

    months.push({
      date: monthDate,
      events: monthEvents,
      name: format(monthDate, 'MMMM', { locale: de })
    });
  }

  return (
    <div className="year-view p-3">
      <div className="year-header text-center mb-4">
        <h3>{format(currentDate, 'yyyy', { locale: de })}</h3>
      </div>
      <Row className="g-2">
        {months.map((month, index) => (
          <Col key={index} md={4} sm={6}>
            <MiniCalendar 
              events={month.events}
              currentDate={month.date}
              title={month.name}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default YearView;
