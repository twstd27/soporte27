import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { getTicket } from '@/api/tickets.api'
import { useAppStore } from '@/store/appStore'
import { formatDate } from '@/utils/formatters'
import { TICKET_STATUSES } from '@/utils/constants'

export default function ThermalPrintPage() {
  const { id } = useParams()
  const company = useAppStore((s) => s.company)

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id).then((r) => r.data.data ?? r.data),
  })

  if (isLoading) {
    return (
      <div style={{ fontFamily: 'monospace', textAlign: 'center', padding: '20px' }}>
        Cargando...
      </div>
    )
  }

  if (!ticket) {
    return (
      <div style={{ fontFamily: 'monospace', textAlign: 'center', padding: '20px' }}>
        Ticket no encontrado
      </div>
    )
  }

  const Sep = () => (
    <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
  )

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
      <span>{label}:</span>
      <span style={{ textAlign: 'right', maxWidth: '55%', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )

  return (
    <>
      <style>{`
        @page { size: 80mm auto; margin: 4mm 5mm; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: white; }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div style={{
        width: '72mm',
        margin: '0 auto',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '11px',
        lineHeight: '1.5',
        color: '#000',
        padding: '2mm 0',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>
          {company?.name ?? 'CENTRO DE SOPORTE'}
        </div>
        {company?.address && (
          <div style={{ textAlign: 'center', fontSize: '9px' }}>{company.address}</div>
        )}
        {company?.phone && (
          <div style={{ textAlign: 'center', fontSize: '9px' }}>Tel: {company.phone}</div>
        )}

        <Sep />

        {/* Ticket number */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}>
          {ticket.ticket_number}
        </div>
        <Row label="Estado" value={TICKET_STATUSES[ticket.status]?.label ?? ticket.status} />
        <Row label="Recepción" value={formatDate(ticket.reception_date)} />
        {ticket.estimated_return_date && (
          <Row label="Entrega est." value={formatDate(ticket.estimated_return_date)} />
        )}

        <Sep />

        {/* Customer */}
        <div style={{ fontWeight: 'bold' }}>CLIENTE</div>
        <div>{ticket.customer?.name ?? '—'}</div>
        {ticket.customer?.phone && <div>Tel: {ticket.customer.phone}</div>}
        {ticket.customer?.document_number && <div>CI/Doc: {ticket.customer.document_number}</div>}

        <Sep />

        {/* Equipment */}
        <div style={{ fontWeight: 'bold' }}>EQUIPO</div>
        {ticket.brand?.name && <Row label="Marca" value={ticket.brand.name} />}
        <Row label="Modelo" value={ticket.model} />
        {ticket.serial_number && <Row label="N° Serie" value={ticket.serial_number} />}
        {ticket.description && (
          <div style={{ fontSize: '10px', marginTop: '2px' }}>{ticket.description}</div>
        )}

        <Sep />

        {/* Problem */}
        <div style={{ fontWeight: 'bold' }}>PROBLEMA REPORTADO</div>
        <div style={{ fontSize: '10px', wordBreak: 'break-word' }}>{ticket.problem_description}</div>

        <Sep />

        {/* Service */}
        <div style={{ fontWeight: 'bold' }}>SERVICIO</div>
        {ticket.support_type?.name && <Row label="Tipo" value={ticket.support_type.name} />}
        {ticket.category?.name && <Row label="Categoría" value={ticket.category.name} />}
        {ticket.technician?.name && <Row label="Técnico" value={ticket.technician.name} />}

        {/* Advance payment */}
        {ticket.advance_payment > 0 && (
          <>
            <Sep />
            <div style={{ fontWeight: 'bold' }}>ADELANTO RECIBIDO</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', textAlign: 'right' }}>
              {Number(ticket.advance_payment).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </>
        )}

        <Sep />

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
          <QRCodeSVG
            value={ticket.ticket_number}
            size={80}
            level="M"
            style={{ display: 'block' }}
          />
          <div style={{ fontSize: '8px', letterSpacing: '0.5px' }}>{ticket.ticket_number}</div>
        </div>

        <Sep />

        <div style={{ textAlign: 'center', fontSize: '9px' }}>
          Gracias por su preferencia
        </div>
        <div style={{ textAlign: 'center', fontSize: '9px' }}>
          ━━━━━━━━━━━━━━━━━━━━━━━━━
        </div>

        {/* Print button – hidden when printing */}
        <div className="no-print" style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 20px',
              cursor: 'pointer',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'sans-serif',
            }}
          >
            Imprimir
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: '8px 20px',
              cursor: 'pointer',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'sans-serif',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  )
}
