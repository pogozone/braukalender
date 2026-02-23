import React, { useState, useCallback, useEffect } from 'react';
import { Container, Navbar, Button, Row, Col } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import de from 'date-fns/locale/de';
import BrauvorgangModal from './components/BrauvorgangModal';
import TerminModal from './components/TerminModal';
import RessourcenUebersicht from './components/RessourcenUebersicht';
import YearView from './components/YearView';
import ThreeMonthsView from './components/ThreeMonthsView';
import { initialResources, brauzeiten } from './data/resources';
import { DataManager } from './utils/dataManager';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './components/CalendarStyles.css';

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

function App() {
  const [dataManager] = useState(() => new DataManager());
  const [brauvorgaenge, setBrauvorgaenge] = useState([]);
  const [termine, setTermine] = useState([]);
  const [showBrauvorgangModal, setShowBrauvorgangModal] = useState(false);
  const [showTerminModal, setShowTerminModal] = useState(false);
  const [editingBrauvorgang, setEditingBrauvorgang] = useState(null);
  const [resources, setResources] = useState(initialResources);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Daten beim Start laden
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataManager.loadFromServer();
        setBrauvorgaenge(data.brauvorgaenge || []);
        setTermine(data.termine || []);
        
        // Ressourcen aus den geladenen Daten aktualisieren
        setResources(prevResources => ({
          ...prevResources,
          gaertanks: data.gärtanks || prevResources.gaertanks,
          faesser: data.faesser || prevResources.faesser
        }));
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        // Fallback zu leeren Daten
        setBrauvorgaenge([]);
        setTermine([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dataManager]);

  const getUtcDayKey = useCallback((date) => {
    const d = new Date(date);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }, []);

  const diffDays = useCallback((start, end) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((getUtcDayKey(end) - getUtcDayKey(start)) / msPerDay);
  }, [getUtcDayKey]);

  const toLocalStartOfDay = useCallback((date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const addLocalDays = useCallback((date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }, []);

  const buildBrauvorgangObjekt = useCallback((brauvorgang) => {
    const tage = brauzeiten[brauvorgang.brauart].tage;

    const dateBT = toLocalStartOfDay(brauvorgang.startDatum);
    const dateStartHG = addLocalDays(dateBT, 1);
    const dateEndHGDefault = addLocalDays(dateStartHG, tage - 1);

    const dateU = brauvorgang.umdrueckDatum
      ? toLocalStartOfDay(brauvorgang.umdrueckDatum)
      : dateEndHGDefault;

    const dateStartNG = new Date(dateU);
    const dateEndNG = addLocalDays(dateStartNG, tage - 1);
    const dateE = new Date(dateEndNG);

    return {
      ...brauvorgang,
      brautag: {
        dateBT,
        background: 'green'
      },
      hauptgaerung: {
        dateStartHG,
        dateEndHG: new Date(dateU),
        background: 'yellow'
      },
      umdruecken: {
        dateU: new Date(dateU),
        background: 'lightgreen'
      },
      nachgaerung: {
        dateStartNG,
        dateEndNG,
        background: 'silver'
      },
      ende: {
        dateE,
        background: 'green'
      }
    };
  }, [addLocalDays, toLocalStartOfDay]);

  const kalenderEvents = [
    ...(termine || []).map(termin => {
      const startDate = new Date(termin.startDatum);
      const endDate = new Date(termin.endDatum);
      
      return {
        id: termin.id,
        title: termin.titel || 'Unbenannter Termin',
        start: startDate,
        end: endDate,
        allDay: true,
        resource: termin,
        className: 'termin-event'
      };
    }),
    ...(brauvorgaenge || []).flatMap(brauvorgang => {
      const brauObj = buildBrauvorgangObjekt(brauvorgang);

      const startDate = new Date(brauObj.brautag.dateBT);
      const endExclusive = addLocalDays(brauObj.ende.dateE, 1);
      
      // Haupt-Brauvorgang Event
      const brauvorgangEvent = {
        id: brauvorgang.id,
        title: `${brauvorgang.titel} - ${brauvorgang.gaertankName}`,
        start: startDate,
        end: endExclusive,
        allDay: true,
        resource: brauvorgang,
        className: 'brauvorgang-event'
      };
      
      // Umdrücken-Termin (falls vorhanden)
      const events = [brauvorgangEvent];
      
      return events;
    })
  ];

  const eventPropGetter = useCallback((event) => {
    return { className: event.className };
  }, []);

  const KalenderEventRenderer = useCallback((props) => {
    const { event } = props;
    if (event.className !== 'brauvorgang-event') {
      return <span>{event.title}</span>;
    }

    const brauObj = buildBrauvorgangObjekt(event.resource);
    // react-big-calendar kann pro View/Zeile ein "geschnittenes" Segment rendern.
    // Wenn start/end (oder slotStart/slotEnd) im Renderer-Props vorhanden sind,
    // verwenden wir diese Segment-Grenzen, damit z.B. in einer Wochenreihe nur 7 Tage erscheinen.
    const segmentStart = props.start || props.slotStart || event.start;
    const segmentEndExclusive = props.end || props.slotEnd || event.end;

    // Zusätzlich: Auf den echten Event-Zeitraum clippen.
    // Beispiel Woche 15-21: Event existiert ggf. erst ab 19. -> dann nur 19/20/21 rendern.
    const eventStart = new Date(event.start);
    const eventEndExclusive = new Date(event.end);

    const maxByDay = (a, b) => (getUtcDayKey(a) >= getUtcDayKey(b) ? a : b);
    const minByDay = (a, b) => (getUtcDayKey(a) <= getUtcDayKey(b) ? a : b);

    const visibleStart = maxByDay(new Date(segmentStart), eventStart);
    const visibleEnd = minByDay(new Date(segmentEndExclusive), eventEndExclusive);

    const start = new Date(visibleStart);
    const endExclusive = new Date(visibleEnd);
    const totalDays = diffDays(start, endExclusive);

    if (!Number.isFinite(totalDays) || totalDays <= 0) {
      return <span>{event.title}</span>;
    }

    const isSameDay = (a, b) => getUtcDayKey(a) === getUtcDayKey(b);

    const getPhaseTypeForDate = (dayDate) => {
      if (isSameDay(dayDate, brauObj.brautag.dateBT)) return 'brautag';
      if (isSameDay(dayDate, brauObj.ende.dateE)) return 'ende';
      if (isSameDay(dayDate, brauObj.umdruecken.dateU)) return 'umdruecken';

      // Hauptgärung: dateStartHG .. (dateU - 1)
      if (getUtcDayKey(dayDate) >= getUtcDayKey(brauObj.hauptgaerung.dateStartHG) && getUtcDayKey(dayDate) < getUtcDayKey(brauObj.umdruecken.dateU)) {
        return 'hauptgaerung';
      }

      // Nachgärung: (dateU + 1) .. (dateE - 1)
      const ngStart = addLocalDays(brauObj.umdruecken.dateU, 1);
      if (getUtcDayKey(dayDate) >= getUtcDayKey(ngStart) && getUtcDayKey(dayDate) < getUtcDayKey(brauObj.ende.dateE)) {
        return 'nachgaerung';
      }

      return 'brautag';
    };

    return (
      <div className="brauvorgang-structure" id={`Brauvorgang-${event.id}`}>
        <div className="brauvorgang-title">{event.title}</div>
        <div className="brauvorgang-phases">
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayDate = addLocalDays(start, i);
            const type = getPhaseTypeForDate(dayDate);
            const dd = String(dayDate.getDate()).padStart(2, '0');
            const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
            const yyyy = String(dayDate.getFullYear());
            const label = `${dd}.${mm}`;
            const full = `${dd}.${mm}.${yyyy}`;
            const id = type === 'hauptgaerung'
              ? `Hauptgaerung-${full}`
              : type === 'umdruecken'
                ? `Umdruecken-${full}`
                : type === 'nachgaerung'
                  ? `Nachgaerung-${full}`
                  : type === 'ende'
                    ? `Ende-${full}`
                    : `Brautag-${full}`;

            return (
              <div
                key={full}
                className={`brauvorgang-day brauvorgang-day--${type}`}
                id={id}
                data-date={full}
                title={full}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [addLocalDays, buildBrauvorgangObjekt, diffDays, getUtcDayKey]);

  const handleBrauvorgangSave = useCallback((brauvorgang) => {
    if (editingBrauvorgang) {
      // Update existing brauvorgang
      setBrauvorgaenge(prev => {
        const updated = prev.map(b => b.id === brauvorgang.id ? brauvorgang : b);
        dataManager.updateBrauvorgang(brauvorgang.id, brauvorgang);
        return updated;
      });
      setEditingBrauvorgang(null);
    } else {
      // Add new brauvorgang
      setBrauvorgaenge(prev => {
        const neueBrauvorgaenge = [...prev, brauvorgang];
        dataManager.addBrauvorgang(brauvorgang);
        return neueBrauvorgaenge;
      });
    }
  }, [dataManager, editingBrauvorgang]);

  const handleBrauvorgangDelete = useCallback((id) => {
    setBrauvorgaenge(prev => {
      const updated = prev.filter(b => b.id !== id);
      dataManager.deleteBrauvorgang(id);
      return updated;
    });
    setEditingBrauvorgang(null);
  }, [dataManager]);

  const handleTerminSave = useCallback((termin) => {
    setTermine(prev => {
      const neueTermine = [...prev, termin];
      dataManager.addTermin(termin);
      return neueTermine;
    });
  }, [dataManager]);

  const handleEventClick = useCallback((event) => {
    if (event.resource.typ === 'brauvorgang' || event.resource.typ === 'umdrueck') {
      const brauvorgang = event.resource;
      setEditingBrauvorgang(brauvorgang);
      setShowBrauvorgangModal(true);
    } else {
      const termin = event.resource;
      alert(`Termin Details:\n\nTitel: ${termin.titel}\nStart: ${termin.startDatum.toLocaleString()}\nEnde: ${termin.endDatum.toLocaleString()}\nBeschreibung: ${termin.beschreibung || 'Keine'}`);
    }
  }, []);

  const handleEventDelete = useCallback((event) => {
    if (event.resource.typ === 'brauvorgang' || event.resource.typ === 'umdrueck') {
      const brauvorgang = event.resource;
      if (window.confirm(`Möchten Sie den Brauvorgang "${brauvorgang.titel}" wirklich löschen?`)) {
        handleBrauvorgangDelete(brauvorgang.id);
      }
    } else {
      const termin = event.resource;
      if (window.confirm(`Möchten Sie den Termin "${termin.titel}" wirklich löschen?`)) {
        // TODO: Implement termin deletion
        alert('Termin-Löschung noch nicht implementiert');
      }
    }
  }, [handleBrauvorgangDelete]);

  const handleSelectSlot = useCallback((slotInfo) => {
    if (slotInfo?.start) {
      setSelectedDate(new Date(slotInfo.start));
    }
  }, []);

  return (
    <div>
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Laden...</span>
          </div>
        </div>
      ) : (
        <>
          <Navbar bg="primary" variant="dark" className="mb-4">
            <Container>
              <Navbar.Brand>Braukalender</Navbar.Brand>
              <div>
                <Button 
                  variant="light" 
                  className="me-2" 
                  onClick={() => setShowTerminModal(true)}
                >
                  + Termin
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => setShowBrauvorgangModal(true)}
                >
                  + Brauvorgang
                </Button>
              </div>
            </Container>
          </Navbar>

          <Container>
            <div className="view-selector mb-3">
              <Button 
                variant={currentView === 'calendar' ? 'primary' : 'outline-primary'}
                onClick={() => setCurrentView('calendar')}
                className="me-2"
              >
                Kalender
              </Button>
              <Button 
                variant={currentView === 'year' ? 'primary' : 'outline-primary'}
                onClick={() => setCurrentView('year')}
                className="me-2"
              >
                Jahresansicht
              </Button>
              <Button 
                variant={currentView === '3months' ? 'primary' : 'outline-primary'}
                onClick={() => setCurrentView('3months')}
              >
                3 Monate
              </Button>
            </div>
            
            <Row>
              <Col lg={8}>
                <div className="calendar-container">
                  {currentView === 'calendar' ? (
                    <Calendar
                      localizer={localizer}
                      events={kalenderEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '600px' }}
                      views={['month', 'week', 'day', 'agenda']}
                      defaultView="month"
                      drilldownView={null}
                      selectable
                      onSelectSlot={handleSelectSlot}
                      onSelectEvent={handleEventClick}
                      onDoubleClickEvent={handleEventDelete}
                      messages={{
                        next: "Weiter",
                        previous: "Zurück",
                        today: "Heute",
                        month: "Monat",
                        week: "Woche",
                        day: "Tag",
                        agenda: "Agenda",
                        date: "Datum",
                        time: "Zeit",
                        event: "Termin",
                        noEventsInRange: "Keine Termine in diesem Zeitraum"
                      }}
                      components={{ event: KalenderEventRenderer }}
                      eventPropGetter={eventPropGetter}
                    />
                  ) : currentView === 'year' ? (
                    <YearView events={kalenderEvents} currentDate={new Date()} onSelectEvent={handleEventClick} onDoubleClickEvent={handleEventDelete} eventRenderer={KalenderEventRenderer} eventPropGetter={eventPropGetter} />
                  ) : currentView === '3months' ? (
                    <ThreeMonthsView events={kalenderEvents} currentDate={new Date()} onSelectEvent={handleEventClick} onDoubleClickEvent={handleEventDelete} eventRenderer={KalenderEventRenderer} eventPropGetter={eventPropGetter} />
                  ) : null}
                </div>
              </Col>
              <Col lg={4}>
                <RessourcenUebersicht 
                  resources={resources} 
                  brauvorgaenge={brauvorgaenge} 
                  selectedDate={selectedDate}
                />
              </Col>
            </Row>
          </Container>

          <BrauvorgangModal
            show={showBrauvorgangModal}
            handleClose={() => {
              setShowBrauvorgangModal(false);
              setEditingBrauvorgang(null);
            }}
            resources={resources}
            brauvorgaenge={brauvorgaenge}
            onSave={handleBrauvorgangSave}
            onDelete={handleBrauvorgangDelete}
            editingBrauvorgang={editingBrauvorgang}
          />

          <TerminModal
            show={showTerminModal}
            handleClose={() => setShowTerminModal(false)}
            onSave={handleTerminSave}
          />
        </>
      )}
    </div>
  );
}

export default App;
