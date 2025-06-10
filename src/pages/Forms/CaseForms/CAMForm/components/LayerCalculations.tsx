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
}

interface Props {
  layers: Layer[];
}

export const LayerCalculations: React.FC<Props> = ({ layers }) => {
  const float = (n: any, d = 2) => Number(n).toFixed(d);

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h4>Desarrollo de los Cálculos</h4>
      </div>
      <div className="card-body">
        {layers.map((layer, idx) => (
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
                            = {float(layer.position_coefficient_exp)}
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
                            = {float(layer.position_coefficient_exp)}
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
                            = {float(layer.position_coefficient_exp)}
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
                            = {float(layer.position_coefficient_exp)}
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
                            = {float(layer.position_coefficient_exp)}
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
                            = {float(layer.position_coefficient_exp)}
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

              {layer.is_protection_layer && (
                <>
                  <p>
                    <strong>
                      Coeficiente de posición no exp (k<sub>pos,noexp,{layer.position}</sub>):
                    </strong>
                  </p>
                  <div style={{ marginLeft: 32, marginBottom: 12 }}>
                    {['PYC', 'PYF', 'FBC', 'FBS', 'OSB'].includes(layer.material) ? (
                      <>
                        <div>
                          k<sub>pos,noexp,{layer.position}</sub> = 0.5 × h<sup>0.15</sup>
                        </div>
                        <div>
                          k<sub>pos,noexp,{layer.position}</sub> = 0.5 × {layer.thickness}
                          <sup>0.15</sup> = {float(layer.position_coefficient_noexp)}
                        </div>
                      </>
                    ) : (
                      <div>
                        k<sub>pos,noexp,{layer.position}</sub> = {float(layer.position_coefficient_noexp)}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/*Cálculo de Δt_i por yeso-cartón RF*/}
              {layer.has_rf_plaster && (
                <div>
                  <strong>
                    Corrección por yeso-cartón RF (Δt<sub>{layer.position}</sub>):
                  </strong>
                  <div style={{ marginLeft: 32, marginTop: 12 }}>
                    {/* Explicación de la fórmula según el tipo de capa/material */}
                    {(() => {
                      if (["LDV", "LDR"].includes(layer.material)) {
                        if (layer.base_time < 6) {
                          return (
                            <div>
                              Δt<sub>{layer.position}</sub> = 0,1 × t<sub>prot,0,{layer.position}</sub> + Σt<sub>prot,0,{Number(layer.position) - 1}</sub> + 1,0
                            </div>
                          );
                        } else {
                          return (
                            <div>
                              Δt<sub>{layer.position}</sub> = 0,22 × t<sub>prot,0,{layer.position}</sub> - 0,1 × Σt<sub>prot,0,{Number(layer.position) - 1}</sub> + 3,5
                            </div>
                          );
                        }
                      } else {
                        if (layer.base_time < 12) {
                          return (
                            <div>
                              Δt<sub>{layer.position}</sub> = 0,03 × Σt<sub>prot,0,{Number(layer.position) - 1}</sub> + 0,9 × {layer.is_protection_layer ? <>t<sub>prot,0,{layer.position}</sub></> : <>t<sub>ais,0,{layer.position}</sub></>} - 2,3
                            </div>
                          );
                        } else {
                          return (
                            <div>
                              Δt<sub>{layer.position}</sub> = 0,22 × Σt<sub>prot,0,{Number(layer.position) - 1}</sub> - 0,1 × {layer.is_protection_layer ? <>t<sub>prot,0,{layer.position}</sub></> : <>t<sub>ais,0,{layer.position}</sub></>} + 4,7
                            </div>
                          );
                        }
                      }
                    })()}
                  </div>
                  <div style={{ marginLeft: 32, marginBottom: 12 }}>
                    = {layer.rf_plaster_correction_time.toFixed(2)} [min]
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
            {idx !== layers.length - 1 && <hr />}
          </div>
        ))}
      </div>
    </div>
  );
}; 