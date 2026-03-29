import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTicket } from '@/api/tickets.api'
import { useAppStore } from '@/store/appStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { TICKET_STATUSES } from '@/utils/constants'

const FIELD_LABELS = {
  diagnosis: 'Diagnóstico',
  work_performed: 'Trabajo realizado',
  labor_cost: 'Mano de obra',
  technician_id: 'Técnico',
}

export default function ThermalPrintPage() {
  const { id } = useParams()
  const company = useAppStore((s) => s.company)

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id).then((r) => r.data.data ?? r.data),
  })

  useEffect(() => {
    if (ticket) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [ticket?.id])

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

  const parts = ticket.spare_parts ?? []
  const partsTotal = parts.reduce((sum, p) => sum + parseFloat(p.subtotal ?? 0), 0)

  const Sep = () => (
    <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
  )

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
      <span>{label}:</span>
      <span style={{ textAlign: 'right', maxWidth: '50%', wordBreak: 'break-word' }}>{value}</span>
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

        {/* Ticket ID */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}>
          {ticket.ticket_number}
        </div>
        <Row label="Estado" value={TICKET_STATUSES[ticket.status]?.label ?? ticket.status} />
        <Row label="Fecha recepción" value={formatDate(ticket.reception_date)} />
        {ticket.estimated_return_date && (
          <Row label="Entrega est." value={formatDate(ticket.estimated_return_date)} />
        )}

        <Sep />

        {/* Customer */}
        <div style={{ fontWeight: 'bold' }}>CLIENTE</div>
        <div>{ticket.customer?.name ?? '—'}</div>
        {ticket.customer?.phone && <div>Tel: {ticket.customer.phone}</div>}
        {ticket.customer?.document_number && <div>CI: {ticket.customer.document_number}</div>}

        <Sep />

        {/* Equipment */}
        <div style={{ fontWeight: 'bold' }}>EQUIPO</div>
        {ticket.brand?.name && <Row label="Marca" value={ticket.brand.name} />}
        <Row label="Modelo" value={ticket.model} />
        {ticket.serial_number && <Row label="N° Serie" value={ticket.serial_number} />}
        {ticket.description && <div style={{ fontSize: '10px', marginTop: '2px' }}>{ticket.description}</div>}

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

        {/* Spare parts */}
        {parts.length > 0 && (
          <>
            <Sep />
            <div style={{ fontWeight: 'bold' }}>REPUESTOS</div>
            {parts.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ maxWidth: '55%', wordBreak: 'break-word' }}>{p.name} x{p.quantity}</span>
                <span>{formatCurrency(p.subtotal)}</span>
              </div>
            ))}
          </>
        )}

        <Sep />

        {/* Costs */}
        <div style={{ fontWeight: 'bold' }}>COSTOS</div>
        <Row label="Mano de obra" value={formatCurrency(ticket.labor_cost)} />
        <Row label="Repuestos" value={formatCurrency(partsTotal)} />
        {ticket.advance_payment > 0 && (
          <Row label="Adelanto" value={`- ${formatCurrency(ticket.advance_payment)}`} />
        )}
        <Sep />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
          <span>TOTAL</span>
          <span>{formatCurrency(ticket.total_cost)}</span>
        </div>

        {ticket.warranty_days && (
          <>
            <Sep />
            <Row label="Garantía" value={`${ticket.warranty_days} días`} />
          </>
        )}

        <Sep />

        <div style={{ textAlign: 'center', fontSize: '9px' }}>
          Gracias por su preferencia
        </div>
        <div style={{ textAlign: 'center', fontSize: '9px' }}>
          ━━━━━━━━━━━━━━━━━━━━━━━━━
        </div>

        {/* Print button – hidden when printing */}
        <div className="no-print" style={{ textAlign: 'center', marginTop: '16px' }}>
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
              marginLeft: '8px',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  )
}
