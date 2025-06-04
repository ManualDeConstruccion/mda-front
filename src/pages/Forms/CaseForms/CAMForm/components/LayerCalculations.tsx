import React from 'react';

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
                Capa {layer.position}: {layer.get_material_display || layer.material}
              </h5>
            </div>
            <div className="card-body">
              {/* Tiempo base */}
              <p>
                <strong>
                  Tiempo base (t<sub>{layer.is_protection_layer ? 'prot' : 'ais'},0,{layer.position}</sub>):
                </strong>
              </p>
              {/* Fórmulas y resultados según material */}
              {layer.material === 'LDV' && (
                <>
                  <p>Para lana de vidrio con ρ ≥ 11 kg/m³:</p>
                  <p>
                    t<sub>ais,0,{layer.position}</sub> = (0.0007 × ρ + 0.046) × h + 13
                  </p>
                  <p>
                    t<sub>ais,0,{layer.position}</sub> = (0.0007 × {layer.apparent_density} + 0.046) × {layer.thickness} + 13 = {float(layer.base_time)} [min]
                  </p>
                </>
              )}
              {layer.material === 'LDR' && (
                <>
                  <p>Para lana de roca con ρ ≥ 26 kg/m³:</p>
                  <p>
                    t<sub>ais,0,{layer.position}</sub> = 0.3 × h × (0.75 × ln(ρ) - ρ/400)
                  </p>
                  <p>
                    t<sub>ais,0,{layer.position}</sub> = 0.3 × {layer.thickness} × (0.75 × ln({layer.apparent_density}) - {layer.apparent_density}/400) = {float(layer.base_time)} [min]
                  </p>
                </>
              )}
              {(layer.material === 'PYC' || layer.material === 'PYF') && (
                <>
                  {layer.is_protection_layer ? (
                    <>
                      <p>Para placas de yeso-cartón o yeso-fibra como protección:</p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 30 × (h/15)<sup>1.2</sup>
                      </p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 30 × ({layer.thickness}/15)<sup>1.2</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Para placas de yeso-cartón o yeso-fibra como aislación:</p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 24 × (h/15)<sup>1.4</sup>
                      </p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 24 × ({layer.thickness}/15)<sup>1.4</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  )}
                </>
              )}
              {layer.material === 'MAD' && (
                <>
                  {layer.is_protection_layer ? (
                    <>
                      <p>Para madera aserrada como protección:</p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 30 × (h/20)<sup>1.1</sup>
                      </p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 30 × ({layer.thickness}/20)<sup>1.1</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Para madera aserrada como aislación:</p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 19 × (h/20)<sup>1.4</sup>
                      </p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 19 × ({layer.thickness}/20)<sup>1.4</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  )}
                </>
              )}
              {layer.material === 'TAB' && (
                <>
                  {layer.is_protection_layer ? (
                    <>
                      <p>Para tableros como protección:</p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 33 × (h/20)<sup>1.1</sup>
                      </p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 33 × ({layer.thickness}/20)<sup>1.1</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Para tableros como aislación:</p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 22 × (h/20)<sup>1.4</sup>
                      </p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 22 × ({layer.thickness}/20)<sup>1.4</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  )}
                </>
              )}
              {layer.material === 'OSB' && (
                <>
                  {layer.is_protection_layer ? (
                    <>
                      <p>Para OSB como protección:</p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 23 × (h/20)<sup>1.1</sup>
                      </p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 23 × ({layer.thickness}/20)<sup>1.1</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Para OSB como aislación:</p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 16 × (h/20)<sup>1.4</sup>
                      </p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 16 × ({layer.thickness}/20)<sup>1.4</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  )}
                </>
              )}
              {layer.material === 'FBC' && (
                <>
                  {layer.is_protection_layer ? (
                    <>
                      <p>Para fibrocemento como protección:</p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 23.43 × (h/15)<sup>1.035</sup>
                      </p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 23.43 × ({layer.thickness}/15)<sup>1.035</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Para fibrocemento como aislación:</p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 10.87 × (h/15)<sup>1.147</sup>
                      </p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 10.87 × ({layer.thickness}/15)<sup>1.147</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  )}
                </>
              )}
              {layer.material === 'FBS' && (
                <>
                  {layer.is_protection_layer ? (
                    <>
                      <p>Para fibrosilicato como protección:</p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 76.27 × (h/25)<sup>1.28</sup>
                      </p>
                      <p>
                        t<sub>prot,0,{layer.position}</sub> = 76.27 × ({layer.thickness}/25)<sup>1.28</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Para fibrosilicato como aislación:</p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 37.64 × (h/25)<sup>1.498</sup>
                      </p>
                      <p>
                        t<sub>ais,0,{layer.position}</sub> = 37.64 × ({layer.thickness}/25)<sup>1.498</sup> = {float(layer.base_time)} [min]
                      </p>
                    </>
                  )}
                </>
              )}

              {/* Cálculos de coeficientes y tiempos */}
              <p>
                <strong>
                  Coeficiente de posición exp (k<sub>pos,exp,{layer.position}</sub>):
                </strong>
              </p>
              <p>
                k<sub>pos,exp,{layer.position}</sub> = 1 - 0.6 × (Σt<sub>prot,0</sub>/
                <sub>{layer.is_protection_layer ? 'prot,0' : 'ais,0'},{layer.position}</sub>
                ) = {float(layer.position_coefficient_exp)}
              </p>

              {layer.is_protection_layer && (
                <>
                  <p>
                    <strong>
                      Coeficiente de posición no exp (k<sub>pos,noexp,{layer.position}</sub>):
                    </strong>
                  </p>
                  {['PYC', 'PYF', 'FBC', 'FBS', 'OSB'].includes(layer.material) ? (
                    <>
                      <p>
                        k<sub>pos,noexp,{layer.position}</sub> = 0.5 × h<sup>0.15</sup>
                      </p>
                      <p>
                        k<sub>pos,noexp,{layer.position}</sub> = 0.5 × {layer.thickness}
                        <sup>0.15</sup> = {float(layer.position_coefficient_noexp)} 
                      </p>
                    </>
                  ) : (
                    <p>
                      k<sub>pos,noexp,{layer.position}</sub> = {float(layer.position_coefficient_noexp)}
                    </p>
                  )}
                </>
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
                <>
                  <p>
                    t<sub>prot,{layer.position}</sub> = (t<sub>prot,0,{layer.position}</sub> × k<sub>pos,exp,{layer.position}</sub> × k<sub>pos,noexp,{layer.position}</sub> + Δt<sub>{layer.position}</sub>) × k<sub>junta,{layer.position}</sub>
                  </p>
                  <p>
                    t<sub>prot,{layer.position}</sub> = ({float(layer.base_time)} × {float(layer.position_coefficient_exp)} × {float(layer.position_coefficient_noexp)} + {float(layer.rf_plaster_correction_time)}) × {float(layer.joint_coefficient)} = {float(layer.total_calculated_time)} [min]
                  </p>
                </>
              ) : (
                <>
                  <p>
                    t<sub>ais,{layer.position}</sub> = (t<sub>ais,0,{layer.position}</sub> × k<sub>pos,exp,{layer.position}</sub> + Δt<sub>{layer.position}</sub>) × k<sub>junta,{layer.position}</sub>
                  </p>
                  <p>
                    t<sub>ais,{layer.position}</sub> = ({float(layer.base_time)} × {float(layer.position_coefficient_exp)} + {float(layer.rf_plaster_correction_time)}) × {float(layer.joint_coefficient)} = {float(layer.total_calculated_time)} [min]
                  </p>
                </>
              )}
            </div>
            {idx !== layers.length - 1 && <hr />}
          </div>
        ))}
      </div>
    </div>
  );
}; 