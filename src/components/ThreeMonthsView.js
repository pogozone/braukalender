import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';
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
    <div className="mini-calendar">
      <h5 className="text-center mb-3">{title}</h5>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultDate={currentDate}
        defaultView="month"
        views={['month']}
        toolbar={false}
        style={{ height: '300px', fontSize: '12px' }}
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

const ThreeMonthsView = ({ events, currentDate }) => {
  const currentMonth = startOfMonth(currentDate);
  const previousMonth = addMonths(currentMonth, -1);
  const nextMonth = addMonths(currentMonth, 1);
  
  const filterEventsForMonth = (monthDate) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (eventStart <= monthEnd && eventEnd >= monthStart);
    });
  };

  return (
    <div className="three-months-view p-3">
      <div className="three-months-header text-center mb-4">
        <h3>Dreimonatsansicht</h3>
        <p className="text-muted">{format(currentDate, 'MMMM yyyy', { locale: de })}</p>
      </div>
      <Row className="g-2">
        <Col md={4}>
          <MiniCalendar 
            events={filterEventsForMonth(previousMonth)}
            currentDate={previousMonth}
            title={format(previousMonth, 'MMMM yyyy', { locale: de })}
          />
        </Col>
        <Col md={4}>
          <MiniCalendar 
            events={filterEventsForMonth(currentMonth)}
            currentDate={currentMonth}
            title={format(currentMonth, 'MMMM yyyy', { locale: de })}
          />
        </Col>
        <Col md={4}>
          <MiniCalendar 
            events={filterEventsForMonth(nextMonth)}
            currentDate={nextMonth}
            title={format(nextMonth, 'MMMM yyyy', { locale: de })}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ThreeMonthsView;
