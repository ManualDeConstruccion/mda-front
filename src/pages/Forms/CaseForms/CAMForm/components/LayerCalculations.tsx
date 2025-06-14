import React from 'react';

const MATERIAL_LABELS: Record<string, string> = {
  PYC: 'Placas de yeso‑cartón',
  PYF: 'Placas de yeso‑fibra',
  MAD: 'Madera aserrada, madera contralaminada, LVL',
  TAB: 'Tableros de partículas, Tableros de fibra',
  OSB: 'OSB, contrachapados',
  LDR: 'Aislación de lana de roca con ρ ≥ 26 kg/m³',
  LDV: 'Aislación de lana de vidrio con ρ ≥ 11 kg/m³',
  FBC: 'Fibrocemento',
  FBS: 'Tipo Fibrosilicato',
};

interface Layer {
  id: number;
  position: string | number;
  material: string;
  get_material_display?: string;
  thickness: number;
  apparent_density?: number | null;
  is_protection_layer: boolean;
  base_time: number;
  position_coefficient_exp: number;
  position_coefficient_noexp?: number;
  rf_plaster_correction_time: number;
  joint_coefficient: number;
  total_calculated_time: number;
  sum_prev_prot_times?: number;
  has_rf_plaster: boolean;
  absolute_position?: number;
  previous_cavity_effect_kpos_exp?: number;
  previous_cavity_effect_kpos_noexp?: number;
  previous_cavity_effect_rf_plaster?: number;
  is_previous_layer_insulation?: boolean;
}

interface Props {
  layers: Layer[];
}

export const LayerCalculations: React.FC<Props> = ({ layers }) => {
  const float = (n: any, d = 2) => (n != null && !isNaN(Number(n)) ? Number(n).toFixed(d) : '-');

  // Ordenar por absolute_position para que los cálculos y efectos sean consistentes con la visualización
  const sortedLayers = [...layers].sort((a, b) => (a.absolute_position ?? 0) - (b.absolute_position ?? 0));

  // Helper para saber si una capa está adyacente a una CAV (usando sortedLayers)
  const getCavityEffect = (idx: number) => {
    let effects: string[] = [];
    // Capa anterior es CAV
    if (sortedLayers[idx - 1]?.material === 'CAV') {
      // Lado no expuesto
      if (["LDV", "LDR"].includes(sortedLayers[idx].material)) {
        effects.push('Se suma Δt_RF');
      } else {
        effects.push('Se suma Δt_RF × 3');
      }
    }
    // Capa posterior es CAV
    if (sortedLayers[idx + 1]?.material === 'CAV') {
      // Lado expuesto
      if (["LDV", "LDR"].includes(sortedLayers[idx].material)) {
        effects.push('kₚₒₛ,ₙₒₑₓₚ = 1.0');
      } else {
        effects.push('Se fuerza kₚₒₛ,ₙₒₑₓₚ como si la capa anterior fuera aislante');
      }
    }
    return effects;
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h4>Desarrollo de los Cálculos</h4>
      </div>
      <div className="card-body">
        {sortedLayers.map((layer, idx) => {
          // No mostrar cálculo para CAV
          if (layer.material === 'CAV') return null;

          // Efectos de cavidad si corresponde
          const cavityEffects = getCavityEffect(idx);

          return (
            <div className="card mb-3" key={layer.id}>
              <div className="card-header">
                <h5 className="mb-0">
                  Capa {layer.position}: {MATERIAL_LABELS[layer.material] || layer.material}
                </h5>
              </div>
              <div className="card-body">
                {/* Tiempo base */}
                <p>
                  <strong>
                    Tiempo base (t<sub>{layer.is_protection_layer ? 'prot' : 'ais'},0,{layer.position}</sub>):
                  </strong>
                </p>
                <div style={{ marginLeft: 32, marginBottom: 12 }}>
                  {/* Fórmulas y resultados según material */}
                  {layer.material === 'LDV' && (
                    <>
                      <div>Para lana de vidrio con ρ ≥ 11 kg/m³:</div>
                      <div>
                        t<sub>ais,0,{layer.position}</sub> = (0.0007 × ρ + 0.046) × h + 13
                      </div>
                      <div>
                        t<sub>ais,0,{layer.position}</sub> = (0.0007 × {layer.apparent_density} + 0.046) × {layer.thickness} + 13 = {float(layer.base_time)} [min]
                      </div>
                    </>
                  )}
                  {layer.material === 'LDR' && (
                    <>
                      <div>Para lana de roca con ρ ≥ 26 kg/m³:</div>
                      <div>
                        t<sub>ais,0,{layer.position}</sub> = 0.3 × h × (0.75 × ln(ρ) - ρ/400)
                      </div>
                      <div>
                        t<sub>ais,0,{layer.position}</sub> = 0.3 × {layer.thickness} × (0.75 × ln({layer.apparent_density}) - {layer.apparent_density}/400) = {float(layer.base_time)} [min]
                      </div>
                    </>
                  )}
                  {(layer.material === 'PYC' || layer.material === 'PYF') && (
                    <>
                      {layer.is_protection_layer ? (
                        <>
                          <div>Para placas de yeso-cartón o yeso-fibra como protección:</div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 30 × (h/15)<sup>1.2</sup>
                          </div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 30 × ({layer.thickness}/15)<sup>1.2</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      ) : (
                        <>
                          <div>Para placas de yeso-cartón o yeso-fibra como aislación:</div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 24 × (h/15)<sup>1.4</sup>
                          </div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 24 × ({layer.thickness}/15)<sup>1.4</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {layer.material === 'MAD' && (
                    <>
                      {layer.is_protection_layer ? (
                        <>
                          <div>Para madera aserrada como protección:</div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 30 × (h/20)<sup>1.1</sup>
                          </div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 30 × ({layer.thickness}/20)<sup>1.1</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      ) : (
                        <>
                          <div>Para madera aserrada como aislación:</div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 19 × (h/20)<sup>1.4</sup>
                          </div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 19 × ({layer.thickness}/20)<sup>1.4</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {layer.material === 'TAB' && (
                    <>
                      {layer.is_protection_layer ? (
                        <>
                          <div>Para tableros como protección:</div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 33 × (h/20)<sup>1.1</sup>
                          </div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 33 × ({layer.thickness}/20)<sup>1.1</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      ) : (
                        <>
                          <div>Para tableros como aislación:</div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 22 × (h/20)<sup>1.4</sup>
                          </div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 22 × ({layer.thickness}/20)<sup>1.4</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {layer.material === 'OSB' && (
                    <>
                      {layer.is_protection_layer ? (
                        <>
                          <div>Para OSB como protección:</div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 23 × (h/20)<sup>1.1</sup>
                          </div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 23 × ({layer.thickness}/20)<sup>1.1</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      ) : (
                        <>
                          <div>Para OSB como aislación:</div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 16 × (h/20)<sup>1.4</sup>
                          </div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 16 × ({layer.thickness}/20)<sup>1.4</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {layer.material === 'FBC' && (
                    <>
                      {layer.is_protection_layer ? (
                        <>
                          <div>Para fibrocemento como protección:</div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 23.43 × (h/15)<sup>1.035</sup>
                          </div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 23.43 × ({layer.thickness}/15)<sup>1.035</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      ) : (
                        <>
                          <div>Para fibrocemento como aislación:</div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 10.87 × (h/15)<sup>1.147</sup>
                          </div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 10.87 × ({layer.thickness}/15)<sup>1.147</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {layer.material === 'FBS' && (
                    <>
                      {layer.is_protection_layer ? (
                        <>
                          <div>Para fibrosilicato como protección:</div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 76.27 × (h/25)<sup>1.28</sup>
                          </div>
                          <div>
                            t<sub>prot,0,{layer.position}</sub> = 76.27 × ({layer.thickness}/25)<sup>1.28</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      ) : (
                        <>
                          <div>Para fibrosilicato como aislación:</div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 37.64 × (h/25)<sup>1.498</sup>
                          </div>
                          <div>
                            t<sub>ais,0,{layer.position}</sub> = 37.64 × ({layer.thickness}/25)<sup>1.498</sup> = {float(layer.base_time)} [min]
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <p>
                  <strong>
                    Coeficiente de posición exp (k<sub>pos,exp,{layer.position}</sub>):
                  </strong>
                </p>
                {/* Visualización mejorada del coeficiente de posición exp */}
                <div style={{ marginLeft: 32, marginBottom: 12 }}>
                  {(() => {
                    // Determinar si es la primera capa
                    const isFirstLayer = Number(layer.position) === 1;
                    // Usar sumatoria de tiempos de protección anteriores si está disponible, si no, 0
                    const sumPrevProt = layer.sum_prev_prot_times ?? 0;
                    // Subíndice de la sumatoria
                    const sumSubIndex = Number(layer.position) - 1;
                    // Etiquetas para sumatoria y base
                    const sumLabel = layer.is_protection_layer
                      ? (<><span>&Sigma;t</span><sub>prot,0,{sumSubIndex}</sub></>)
                      : (<><span>&Sigma;t</span><sub>prot,0,n-{sumSubIndex}</sub></>);
                    let baseLabel: JSX.Element = <></>;
                    let baseDivisor = 0;
                    let divisorDesc: JSX.Element = <></>;
                    // Para LDV y LDR, el denominador puede ser especial
                    if (layer.material === 'LDV') {
                      baseLabel = <><span>t</span><sub>ais,0,{layer.position}</sub></>;
                      baseDivisor = layer.base_time / 4;
                      divisorDesc = <>{baseLabel} / 4</>;
                    } else if (layer.material === 'LDR') {
                      baseLabel = <><span>t</span><sub>ais,0,{layer.position}</sub></>;
                      baseDivisor = layer.base_time / 2;
                      divisorDesc = <>{baseLabel} / 2</>;
                    } else if (["PYC", "PYF", "MAD", "TAB", "OSB", "FBC", "FBS"].includes(layer.material)) {
                      baseLabel = layer.is_protection_layer
                        ? (<><span>t</span><sub>prot,0,{layer.position}</sub></>)
                        : (<><span>t</span><sub>ais,0,{layer.position}</sub></>);
                      baseDivisor = layer.base_time / 2;
                      divisorDesc = <>{baseLabel} / 2</>;
                    }
                    // Mostrar comparación
                    const comparison = sumPrevProt <= baseDivisor ? '≤' : '>';
                    // Mostrar sumatoria explícitamente si no es la primera capa
                    const sumatoriaDiv = !isFirstLayer ? (
                      <div>
                        Para {sumLabel} = {float(sumPrevProt)} [min] {comparison} {divisorDesc}
                      </div>
                    ) : null;
                    // Fórmulas y condiciones según material y tipo de capa
                    if (isFirstLayer) {
                      // Primera capa: kpos,exp = 1
                      return (
                        <div>k<sub>pos,exp,{layer.position}</sub> = 1</div>
                      );
                    }
                    // Para revestimientos (yeso-cartón, yeso-fibra, madera, fibrocemento, fibrosilicato)
                    if (["PYC", "PYF", "MAD", "TAB", "OSB", "FBC", "FBS"].includes(layer.material)) {
                      if (sumPrevProt <= layer.base_time / 2) {
                        return (
                          <>
                            {sumatoriaDiv}
                            <div>
                              k<sub>pos,exp,{layer.position}</sub> = 1 - 0,6 × (
                              <span>&Sigma;t</span><sub>prot,0,{sumSubIndex}</sub> / {layer.is_protection_layer ? (<><span>t</span><sub>prot,0,{layer.position}</sub></>) : (<><span>t</span><sub>ais,0,{layer.position}</sub></>)}
                              )
                            </div>
                            <div>
                              = 1 - 0,6 × ({float(sumPrevProt)} / {float(layer.base_time)})
                            </div>
                            <div>
                              = {layer.previous_cavity_effect_kpos_exp ? float(layer.previous_cavity_effect_kpos_exp) : float(layer.position_coefficient_exp)}
                            </div>
                          </>
                        );
                      } else {
                        // Usar raíz cuadrada y denominador según tipo de capa
                        return (
                          <>
                            {sumatoriaDiv}
                            <div>
                              k<sub>pos,exp,{layer.position}</sub> = 0,5 × √(
                              {layer.is_protection_layer ? (<><span>t</span><sub>prot,0,{layer.position}</sub></>) : (<><span>t</span><sub>ais,0,{layer.position}</sub></>)}
                              {' / '}
                              {sumLabel}
                              )
                            </div>
                            <div>
                              = 0,5 × √({float(layer.base_time)} / {float(sumPrevProt)})
                            </div>
                            <div>
                              = {layer.previous_cavity_effect_kpos_exp ? float(layer.previous_cavity_effect_kpos_exp) : float(layer.position_coefficient_exp)}
                            </div>
                          </>
                        );
                      }
                    }
                    // Para aislante de lana de roca
                    if (layer.material === "LDR") {
                      if (sumPrevProt <= layer.base_time / 2) {
                        return (
                          <>
                            {sumatoriaDiv}
                            <div>
                              k<sub>pos,exp,{layer.position}</sub> = 1 - 0,6 × (
                              <span>&Sigma;t</span><sub>prot,0,{sumSubIndex}</sub> / t<sub>ais,0,{layer.position}</sub>
                              )
                            </div>
                            <div>
                              = 1 - 0,6 × ({float(sumPrevProt)} / {float(layer.base_time)})
                            </div>
                            <div>
                              = {layer.previous_cavity_effect_kpos_exp ? float(layer.previous_cavity_effect_kpos_exp) : float(layer.position_coefficient_exp)}
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            {sumatoriaDiv}
                            <div>
                              k<sub>pos,exp,{layer.position}</sub> = 0,5 × (t<sub>ais,0,{layer.position}</sub> / <span>&Sigma;t</span><sub>prot,0,{sumSubIndex}</sub>)
                            </div>
                            <div>
                              = 0,5 × ({float(layer.base_time)} / {float(sumPrevProt)})
                            </div>
                            <div>
                              = {layer.previous_cavity_effect_kpos_exp ? float(layer.previous_cavity_effect_kpos_exp) : float(layer.position_coefficient_exp)}
                            </div>
                          </>
                        );
                      }
                    }
                    // Para aislante de lana de vidrio (LDV, fórmula especial)
                    if (layer.material === "LDV") {
                      if (sumPrevProt <= layer.base_time / 4) {
                        return (
                          <>
                            {sumatoriaDiv}
                            <div>
                              k<sub>pos,exp,{layer.position}</sub> = 1 - 0,8 × (
                              <span>&Sigma;t</span><sub>prot,0,{sumSubIndex}</sub> / t<sub>ais,0,{layer.position}</sub>
                              )
                            </div>
                            <div>
                              = 1 - 0,8 × ({float(sumPrevProt)} / {float(layer.base_time)})
                            </div>
                            <div>
                              = {layer.previous_cavity_effect_kpos_exp ? float(layer.previous_cavity_effect_kpos_exp) : float(layer.position_coefficient_exp)}
                            </div>
                          </>
                        );
                      } else {
                        // Exponente especial para LDV
                        const exp = 0.75 - 0.002 * (layer.apparent_density ?? 0);
                        const baseDiv = (layer.base_time && sumPrevProt) ? (layer.base_time / sumPrevProt) : 0;
                        const coef = 0.001 * (layer.apparent_density ?? 0) + 0.27;
                        return (
                          <>
                            {sumatoriaDiv}
                            <div>
                              k<sub>pos,exp,{layer.position}</sub> = (0,001 × {layer.apparent_density} + 0,27) × ( {float(layer.base_time)} / {float(sumPrevProt)} )<sup>{float(exp)}</sup>
                            </div>
                            <div>
                              = ({float(coef)}) × ({float(baseDiv)})<sup>{float(exp)}</sup>
                            </div>
                            <div>
                              = {layer.previous_cavity_effect_kpos_exp ? float(layer.previous_cavity_effect_kpos_exp) : float(layer.position_coefficient_exp)}
                            </div>
                          </>
                        );
                      }
                    }
                    // Por defecto, si no hay fórmula especial:
                    return (
                      <div>k<sub>pos,exp,{layer.position}</sub> = {float(layer.position_coefficient_exp)}</div>
                    );
                  })()}
                </div>


                {/* Visualización mejorada del coeficiente de posición no exp */}
                {layer.is_protection_layer && (
                  <>
                    <p>
                      <strong>
                        Coeficiente de posición no exp (k<sub>pos,noexp,{layer.position}</sub>):
                      </strong>
                    </p>
                    <div style={{ marginLeft: 32, marginBottom: 12 }}>
                      {(() => {
                        // Determinar si se usa la fórmula de aislación
                        const useInsulationFormula =
                          layer.is_previous_layer_insulation ||
                          (!!layer.previous_cavity_effect_kpos_noexp && layer.previous_cavity_effect_kpos_noexp !== 0);

                        // Variables útiles
                        const h = layer.thickness;
                        const rho = layer.apparent_density ?? 0;
                        let formula = '';
                        let result = '';

                        // Fórmulas según material y tipo de apoyo
                        switch (layer.material) {
                          case 'PYC':
                          case 'PYF':
                          case 'FBC':
                          case 'FBS':
                          case 'OSB':
                            if (useInsulationFormula) {
                              formula = `0.5 × h_i^0.15`;
                              result = `0.5 × ${h}^0.15 = ${float(layer.previous_cavity_effect_kpos_noexp ?? layer.position_coefficient_noexp)}`;
                            } else {
                              formula = `1.0`;
                              result = `1.0`;
                            }
                            break;
                          case 'MAD':
                            if (useInsulationFormula) {
                              formula = `0.35 × h_i^0.21`;
                              result = `0.35 × ${h}^0.21 = ${float(layer.previous_cavity_effect_kpos_noexp ?? layer.position_coefficient_noexp)}`;
                            } else {
                              formula = `1.0`;
                              result = `1.0`;
                            }
                            break;
                          case 'TAB':
                            if (useInsulationFormula) {
                              formula = `0.41 × h_i^0.18`;
                              result = `0.41 × ${h}^0.18 = ${float(layer.previous_cavity_effect_kpos_noexp ?? layer.position_coefficient_noexp)}`;
                            } else {
                              formula = `1.0`;
                              result = `1.0`;
                            }
                            break;
                          case 'LDR':
                            if (useInsulationFormula) {
                              formula = `0.18 × h_i^(0.001ρ_i+0.08)`;
                              result = `0.18 × ${h}^(${0.001 * rho + 0.08}) = ${float(layer.previous_cavity_effect_kpos_noexp ?? layer.position_coefficient_noexp)}`;
                            } else {
                              formula = `1.0`;
                              result = `1.0`;
                            }
                            break;
                          case 'LDV':
                            if (useInsulationFormula) {
                              formula = `0.5 × h_i - h_i²/30000 + ρ_i^0.09 - 1.3`;
                              result = `0.5 × ${h} - ${h}²/30000 + ${rho}^0.09 - 1.3 = ${float(layer.previous_cavity_effect_kpos_noexp ?? layer.position_coefficient_noexp)}`;
                            } else {
                              formula = `1.0`;
                              result = `1.0`;
                            }
                            break;
                          default:
                            result = float(layer.previous_cavity_effect_kpos_noexp ?? layer.position_coefficient_noexp);
                        }

                        return (
                          <>
                            <div>
                              {useInsulationFormula
                                ? <>Fórmula para capas apoyadas por <strong>aislación</strong>:</>
                                : <>Fórmula para capas apoyadas por <strong>revestimientos de yeso o madera</strong>:</>
                              }
                            </div>
                            <div>
                              k<sub>pos,noexp,{layer.position}</sub> = {formula}
                            </div>
                            <div>
                              = {result}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/*Cálculo de Δt_i por yeso-cartón RF*/}
                {layer.has_rf_plaster && (
                  <div>
                    <strong>
                      Corrección por protección con placas de yeso-cartón RF (Δt<sub>{layer.position}</sub>):
                    </strong>
                    <div style={{ marginLeft: 32, marginTop: 12 }}>
                      {/* Explicación de la fórmula según el tipo de capa/material */}
                      {(() => {
                        const prevLayer = sortedLayers.find(l => Number(l.position) === Number(layer.position) - 1);
                        const prevBaseTime = prevLayer ? prevLayer.total_calculated_time : 0;
                        if (["LDV", "LDR"].includes(layer.material)) {
                          if (layer.base_time < 6) {
                            return (
                              <>
                                <div>
                                  Δt<sub>{layer.position}</sub> = (0,1 × t<sub>prot,{Number(layer.position) - 1}</sub>) + t<sub>prot,0,{layer.position}</sub> + 1,0
                                </div>
                                <div>
                                  Δt<sub>{layer.position}</sub> = (0,1 × {float(prevBaseTime)}) + {float(layer.base_time)} + 1,0
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <div>
                                  Δt<sub>{layer.position}</sub> = (0,22 × t<sub>prot,{Number(layer.position) - 1}</sub>) - (0,1 × t<sub>prot,0,{layer.position}</sub>) + 3,5
                                </div>
                                <div>
                                  Δt<sub>{layer.position}</sub> = (0,22 × {float(prevBaseTime)}) - (0,1 × {float(layer.base_time)}) + 3,5
                                </div>
                              </>
                            );
                          }
                        } else {
                          if (layer.base_time < 12) {
                            return (
                              <>
                                <div>
                                  Δt<sub>{layer.position}</sub> = (0,03 × t<sub>prot,{Number(layer.position) - 1}</sub>) + (0,9 × {layer.is_protection_layer ? <>t<sub>prot,0,{layer.position}</sub></> : <>t<sub>ais,0,{layer.position}</sub></>}) - 2,3
                                </div>
                                <div>
                                  Δt<sub>{layer.position}</sub> = (0,03 × {float(prevBaseTime)}) + (0,9 × {float(layer.base_time)}) - 2,3
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <div>
                                  Δt<sub>{layer.position}</sub> = (0,22 × t<sub>prot,{Number(layer.position) - 1}</sub>) - (0,1 × {layer.is_protection_layer ? <>t<sub>prot,0,{layer.position}</sub></> : <>t<sub>ais,0,{layer.position}</sub></>}) + 4,7
                                </div>
                                <div>
                                  Δt<sub>{layer.position}</sub> = (0,22 × {float(prevBaseTime)}) - (0,1 × {float(layer.base_time)}) + 4,7
                                </div>
                              </>
                            );
                          }
                        }
                      })()}
                    </div>
                    <div style={{ marginLeft: 32, marginBottom: 12 }}>
                      = {layer.previous_cavity_effect_rf_plaster ? float(layer.previous_cavity_effect_rf_plaster) : float(layer.rf_plaster_correction_time)} [min]
                    </div>
                  </div>
                )}

                {/* Efecto de cavidades */}
                {cavityEffects.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>Efecto de las cavidades vacías (huecas):</strong>
                    <div style={{ marginLeft: 32, marginTop: 12, marginBottom: 12 }}>
                      {/* Desarrollo de factores de cavidad según cuadro */}
                      {(() => {
                        const isMineralWool = ['LDV', 'LDR'].includes(layer.material);
                        // kpos,exp
                        let kposExpDev = null;
                        if (
                          layer.previous_cavity_effect_kpos_exp !== undefined &&
                          layer.previous_cavity_effect_kpos_exp !== null
                        ) {
                          kposExpDev = (
                            <div style={{ marginBottom: 20 }}>
                              <div>Se aplica 1,6 × k<sub>pos,exp,{layer.position}</sub></div>
                              <div>
                                1,6 × {Number(layer.previous_cavity_effect_kpos_exp).toFixed(2)} = {Number(layer.position_coefficient_exp).toFixed(2)}
                              </div>
                            </div>
                          );
                        }
                        // Δt
                        let deltaTDev = null;
                        if (
                          layer.previous_cavity_effect_rf_plaster !== undefined &&
                          layer.previous_cavity_effect_rf_plaster !== null
                        ) {
                          if (isMineralWool) {
                            deltaTDev = (
                              <div style={{ marginBottom: 12 }}>
                                <div>Se suma Δt_RF</div>
                                <div>
                                  Δt<sub>{layer.position}</sub> = 1 × {Number(layer.previous_cavity_effect_rf_plaster).toFixed(2)}
                                </div>
                                <div>
                                  {Number(layer.rf_plaster_correction_time).toFixed(2)} [min]
                                </div>
                              </div>
                            );
                          } else {
                            deltaTDev = (
                              <div style={{ marginBottom: 12 }}>
                                <div>Se suma Δt_RF × 3</div>
                                <div>
                                  Δt<sub>{layer.position}</sub> = {Number(layer.previous_cavity_effect_rf_plaster).toFixed(2)} × 3 = {Number(layer.rf_plaster_correction_time).toFixed(2)} [min]
                                </div>
                              </div>
                            );
                          }
                        }
                        return (
                          <>
                            {kposExpDev}
                            {deltaTDev}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <p>
                  <strong>
                    Tiempo total (
                    {layer.is_protection_layer ? (
                      <>
                        t<sub>prot,{layer.position}</sub>
                      </>
                    ) : (
                      <>
                        t<sub>ais,{layer.position}</sub>
                      </>
                    )}
                    ):
                  </strong>
                </p>
                {layer.is_protection_layer ? (
                  <div style={{ marginLeft: 32, marginBottom: 12 }}>
                    <div>
                      t<sub>prot,{layer.position}</sub> = (t<sub>prot,0,{layer.position}</sub> × k<sub>pos,exp,{layer.position}</sub> × k<sub>pos,noexp,{layer.position}</sub> + Δt<sub>{layer.position}</sub>) × k<sub>junta,{layer.position}</sub> [min]
                    </div>
                    <div>
                      = ({float(layer.base_time)} × {float(layer.position_coefficient_exp)} × {float(layer.position_coefficient_noexp ?? 1)} + {float(layer.rf_plaster_correction_time)}) × {float(layer.joint_coefficient)} [min]
                    </div>
                    <div>
                      = {float(layer.base_time * layer.position_coefficient_exp * (layer.position_coefficient_noexp ?? 1) + layer.rf_plaster_correction_time)} × {float(layer.joint_coefficient)} [min]
                    </div>
                    <div>
                      = {float(layer.total_calculated_time)} [min]
                    </div>
                  </div>
                ) : (
                  <div style={{ marginLeft: 32, marginBottom: 12 }}>
                    <div>
                      t<sub>ais,{layer.position}</sub> = (t<sub>ais,0,{layer.position}</sub> × k<sub>pos,exp,{layer.position}</sub> + Δt<sub>{layer.position}</sub>) × k<sub>junta,{layer.position}</sub>
                    </div>
                    <div>
                      = ({float(layer.base_time)} × {float(layer.position_coefficient_exp)} + {float(layer.rf_plaster_correction_time)}) × {float(layer.joint_coefficient)}
                    </div>
                    <div>
                      = {float(layer.base_time * layer.position_coefficient_exp + layer.rf_plaster_correction_time)} × {float(layer.joint_coefficient)}
                    </div>
                    <div>
                      = {float(layer.total_calculated_time)} [min]
                    </div>
                  </div>
                )}
              </div>
              {idx !== sortedLayers.length - 1 && <hr />}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 