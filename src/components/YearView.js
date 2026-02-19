import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { format, startOfMonth, endOfMonth, addMonths, startOfYear } from 'date-fns';
import de from 'date-fns/locale/de';

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
      <Row className="g-3">
        {months.map((month, index) => (
          <Col key={index} md={4} sm={6}>
            <Card className="h-100 month-card">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">{month.name}</h6>
              </Card.Header>
              <Card.Body className="p-2">
                <div className="month-events">
                  {month.events.slice(0, 3).map((event, eventIndex) => (
                    <div key={eventIndex} className="mini-event mb-2 p-2 border rounded">
                      <div className="event-title small fw-bold text-truncate">
                        {event.title}
                      </div>
                      <div className="event-date text-muted small">
                        {format(new Date(event.start), 'dd.MM.', { locale: de })}
                        {event.end && format(new Date(event.end), '-dd.MM.', { locale: de })}
                      </div>
                    </div>
                  ))}
                  {month.events.length > 3 && (
                    <div className="more-events text-muted small text-center p-2">
                      +{month.events.length - 3} weitere
                    </div>
                  )}
                  {month.events.length === 0 && (
                    <div className="no-events text-muted small text-center p-3">
                      Keine Termine
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default YearView;
