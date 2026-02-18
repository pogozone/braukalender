import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TerminModal = ({ show, handleClose, onSave }) => {
  const [titel, setTitel] = useState('');
  const [startDatum, setStartDatum] = useState(new Date());
  const [endDatum, setEndDatum] = useState(new Date());
  const [beschreibung, setBeschreibung] = useState('');

  useEffect(() => {
    if (show) {
      setTitel('');
      setStartDatum(new Date());
      setEndDatum(new Date());
      setBeschreibung('');
    }
  }, [show]);

  const handleSave = () => {
    if (!titel.trim()) {
      return;
    }

    const termin = {
      id: Date.now(),
      titel,
      startDatum,
      endDatum,
      beschreibung,
      typ: 'termin'
    };

    onSave(termin);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Neuer Termin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Titel</Form.Label>
            <Form.Control
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Termin Titel eingeben"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Startdatum</Form.Label>
            <DatePicker
              selected={startDatum}
              onChange={setStartDatum}
              className="form-control"
              dateFormat="dd.MM.yyyy HH:mm"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={30}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Enddatum</Form.Label>
            <DatePicker
              selected={endDatum}
              onChange={setEndDatum}
              className="form-control"
              dateFormat="dd.MM.yyyy HH:mm"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={30}
              minDate={startDatum}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Beschreibung</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              placeholder="Optionale Beschreibung"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Abbrechen
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!titel.trim()}>
          Termin speichern
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TerminModal;
