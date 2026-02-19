import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import de from 'date-fns/locale/de';

const ThreeMonthsView = ({ events, currentDate }) => {
  const months = [];
  const currentMonth = startOfMonth(currentDate);
  
  for (let i = -1; i <= 1; i++) {
    const monthDate = addMonths(currentMonth, i);
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
      name: format(monthDate, 'MMMM yyyy', { locale: de })
    });
  }

  return (
    <div className="three-months-view p-3">
      <div className="three-months-header text-center mb-4">
        <h3>Dreimonatsansicht</h3>
        <p className="text-muted">{format(currentDate, 'MMMM yyyy', { locale: de })}</p>
      </div>
      <Row>
        {months.map((month, index) => (
          <Col key={index} md={4}>
            <Card className="month-card-large h-100">
              <Card.Header className={`bg-${index === 1 ? 'primary' : 'secondary'} text-white`}>
                <h5 className="mb-0">{month.name}</h5>
              </Card.Header>
              <Card.Body className="p-2">
                <div className="month-events-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {month.events.map((event, eventIndex) => (
                    <div key={eventIndex} className="event-item mb-2 pb-2 border-bottom">
                      <div className="event-title fw-bold text-truncate">
                        {event.title}
                      </div>
                      <div className="event-date text-muted small">
                        {format(new Date(event.start), 'dd.MM.yyyy', { locale: de })}
                        {event.end && ` - ${format(new Date(event.end), 'dd.MM.yyyy', { locale: de })}`}
                      </div>
                    </div>
                  ))}
                  {month.events.length === 0 && (
                    <div className="no-events text-muted text-center p-3">
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

export default ThreeMonthsView;
