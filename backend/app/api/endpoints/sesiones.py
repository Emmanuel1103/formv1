from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from schemas.sesion import SesionCreate, SesionUpdate, SesionResponse, SesionPublicResponse, OcurrenciaCreate, OcurrenciaUpdate, OcurrenciaResponse
from services import sesiones as sesion_service
from services import asistentes as asistente_service
from services.usuarios import usuario_service
from core.security import get_current_user

router = APIRouter(prefix="/api/sesiones", tags=["sesiones"])

@router.post("", response_model=SesionResponse, status_code=status.HTTP_201_CREATED)
async def crear_sesion(sesion: SesionCreate, current_user: dict = Depends(get_current_user)):
    """
    Crear nueva capacitación (requiere autenticación en producción)
    """
    user_id = current_user.get('oid')
    sesion_creada = False
    contador_incrementado = False
    
    try:
        data = sesion.dict()
        # Si se seleccionó 'Otros' y se especificó un valor personalizado, usarlo
        if data.get('tipo_actividad') == 'Otros' and data.get('tipo_actividad_custom'):
            data['tipo_actividad'] = data.pop('tipo_actividad_custom')

        data['created_by'] = current_user.get('email')
        data['created_by_id'] = user_id
        data['created_by_name'] = current_user.get('name')
        
        # Crear la sesión
        nueva_sesion = sesion_service.crear_sesion(data)
        nueva_sesion['total_asistentes'] = 0
        # Poblar total_asistentes en ocurrencias (siempre 0 al crear)
        for oc in nueva_sesion.get('ocurrencias', []):
            oc['total_asistentes'] = 0
        sesion_creada = True
        
        # Incrementar contador de formularios del usuario
        if user_id:
            try:
                usuario_service.incrementar_formularios_creados(user_id)
                contador_incrementado = True
            except Exception as e:
                if sesion_creada:
                    try:
                        sesion_service.delete_sesion(nueva_sesion['id'])
                    except:
                        pass
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error al actualizar contador de formularios: {str(e)}"
                )
        
        return nueva_sesion
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        if sesion_creada and contador_incrementado and user_id:
            try:
                usuario_service.decrementar_formularios_creados(user_id)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al crear la sesión: {str(e)}"
        )

@router.get("", response_model=List[SesionResponse])
async def listar_sesiones(current_user: dict = Depends(get_current_user)):
    """
    Listar todas las capacitaciones (requiere autenticación en producción)
    """
    try:
        user_email = current_user.get('email')
        user_oid = current_user.get('oid') or current_user.get('sub')
        
        # Obtener el rol del usuario para determinar qué puede ver
        try:
            rol = usuario_service.obtener_rol_usuario(user_oid)
        except Exception as e:
            print(f"Error al determinar rol de usuario: {e}")
            rol = "Usuario"
        
        if rol == "Administrador":
            # Para admin: Sus propias sesiones + todas las de tipo Inducción/Formación de otros
            sesiones = sesion_service.get_sesiones_para_admin(user_email)
        else:
            # Para usuario normal: Solo lo propio
            sesiones = sesion_service.get_all_sesiones(owner_email=user_email)
        
        # Añadir conteo de asistentes e información del creador
        for sesion in sesiones:
            # Poblar nombre del creador si falta (para registros antiguos)
            if not sesion.get('created_by_name') and sesion.get('created_by_id'):
                try:
                    u = usuario_service.obtener_usuario_por_id(sesion['created_by_id'])
                    if u:
                        sesion['created_by_name'] = u.get('nombre')
                except:
                    pass

            try:
                asistentes = asistente_service.get_asistentes_by_sesion(sesion['id'])
                # Conteo total (acumulado)
                sesion['total_asistentes'] = len(asistentes)
                # Conteo principal (solo los que no tienen ocurrencia_id)
                sesion['total_asistentes_principal'] = len([a for a in asistentes if not a.get('ocurrencia_id')])
                # Conteo por ocurrencia
                for oc in sesion.get('ocurrencias', []):
                    oc_asistentes = [a for a in asistentes if a.get('ocurrencia_id') == oc['id']]
                    oc['total_asistentes'] = len(oc_asistentes)
            except Exception as e:
                print(f"Error procesando asistentes para sesión {sesion.get('id')}: {e}")
                sesion['total_asistentes'] = 0
                sesion['total_asistentes_principal'] = 0
        
        return sesiones
    except Exception as e:
        print(f"Error crítico en listar_sesiones: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al listar sesiones: {str(e)}"
        )

@router.get("/{sesion_id}", response_model=SesionResponse)
async def obtener_sesion(sesion_id: str, current_user: dict = Depends(get_current_user)):
    """
    Obtener detalles de una capacitación (requiere autenticación en producción)
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    asistentes = asistente_service.get_asistentes_by_sesion(sesion_id)
    sesion['total_asistentes'] = len(asistentes)
    sesion['total_asistentes_principal'] = len([a for a in asistentes if not a.get('ocurrencia_id')])
    for oc in sesion.get('ocurrencias', []):
        oc_asistentes = [a for a in asistentes if a.get('ocurrencia_id') == oc['id']]
        oc['total_asistentes'] = len(oc_asistentes)
    
    return sesion

@router.put("/{sesion_id}", response_model=SesionResponse)
async def actualizar_sesion(sesion_id: str, sesion_update: SesionUpdate, current_user: dict = Depends(get_current_user)):
    """
    Actualizar información de una capacitación (requiere autenticación)
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    try:
        datos_actualizacion = sesion_update.dict(exclude_unset=True)
        
        if datos_actualizacion.get('tipo_actividad') == 'Otros' and datos_actualizacion.get('tipo_actividad_custom'):
            datos_actualizacion['tipo_actividad'] = datos_actualizacion.pop('tipo_actividad_custom')
        
        sesion_actualizada = sesion_service.actualizar_sesion(sesion_id, datos_actualizacion)
        
        asistentes = asistente_service.get_asistentes_by_sesion(sesion_id)
        sesion_actualizada['total_asistentes'] = len(asistentes)
        sesion_actualizada['total_asistentes_principal'] = len([a for a in asistentes if not a.get('ocurrencia_id')])
        for oc in sesion_actualizada.get('ocurrencias', []):
            oc_asistentes = [a for a in asistentes if a.get('ocurrencia_id') == oc['id']]
            oc['total_asistentes'] = len(oc_asistentes)
        
        return sesion_actualizada
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{sesion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_sesion(sesion_id: str, current_user: dict = Depends(get_current_user)):
    """
    Eliminar capacitación y todos sus asistentes (requiere autenticación en producción)
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    sesion_eliminada = False
    contador_decrementado = False
    errores = []
    
    try:
        user_id = current_user.get('oid')
        if user_id:
            try:
                usuario_service.decrementar_formularios_creados(user_id)
                contador_decrementado = True
            except Exception as e:
                errores.append(f"Error al decrementar contador: {str(e)}")
        
        try:
            asistente_service.delete_asistentes_by_sesion(sesion_id)
        except Exception as e:
            errores.append(f"Error al eliminar asistentes: {str(e)}")
        
        try:
            deleted = sesion_service.delete_sesion(sesion_id)
            if deleted:
                sesion_eliminada = True
            else:
                errores.append("No se pudo eliminar la sesión")
        except Exception as e:
            errores.append(f"Error al eliminar sesión: {str(e)}")
        
        if not sesion_eliminada and contador_decrementado and user_id:
            try:
                usuario_service.incrementar_formularios_creados(user_id)
            except:
                pass
        
        if not sesion_eliminada:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al eliminar la sesión: {'; '.join(errores)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        if contador_decrementado and user_id:
            try:
                usuario_service.incrementar_formularios_creados(user_id)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al eliminar la sesión: {str(e)}"
        )

# ─── Endpoints de Ocurrencias ───────────────────────────────────────────────

@router.post("/{sesion_id}/ocurrencias", response_model=OcurrenciaResponse, status_code=status.HTTP_201_CREATED)
async def agregar_ocurrencia(sesion_id: str, ocurrencia: OcurrenciaCreate, current_user: dict = Depends(get_current_user)):
    """
    Añadir una nueva fecha/ocurrencia a una formación recurrente.
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    try:
        nueva_oc = sesion_service.agregar_ocurrencia(
            sesion_id,
            ocurrencia.fecha,
            ocurrencia.hora_inicio,
            ocurrencia.hora_fin,
            ocurrencia.facilitador,
            ocurrencia.contenido,
            ocurrencia.tipo_actividad,
            ocurrencia.tipo_formacion,
            ocurrencia.modalidad,
            ocurrencia.responsable,
            ocurrencia.cargo,
            ocurrencia.tema
        )
        nueva_oc['total_asistentes'] = 0
        return nueva_oc
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{sesion_id}/ocurrencias/{ocurrencia_id}", response_model=OcurrenciaResponse)
async def actualizar_ocurrencia(
    sesion_id: str, 
    ocurrencia_id: str, 
    ocurrencia_data: OcurrenciaUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Actualizar una ocurrencia/fecha específica.
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    try:
        data = ocurrencia_data.dict(exclude_unset=True)
        actualizada = sesion_service.actualizar_ocurrencia(sesion_id, ocurrencia_id, data)
        return actualizada
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{sesion_id}/ocurrencias/{ocurrencia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_ocurrencia(sesion_id: str, ocurrencia_id: str, current_user: dict = Depends(get_current_user)):
    """
    Eliminar una ocurrencia/fecha de una formación.
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    if sesion.get('created_by') and sesion.get('created_by') != current_user.get('email'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    eliminado = sesion_service.eliminar_ocurrencia(sesion_id, ocurrencia_id)
    if not eliminado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ocurrencia no encontrada")

# ─── Endpoints existentes (asistentes y QR) ─────────────────────────────────

@router.get("/{sesion_id}/asistentes")
async def obtener_asistentes(sesion_id: str, ocurrencia_id: str = None):
    """
    Obtener lista de asistentes de una capacitación.
    Parámetro opcional ocurrencia_id para filtrar por fecha.
    Por defecto devuelve solo los de la sesión principal.
    """
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    
    asistentes = asistente_service.get_asistentes_by_sesion(sesion_id)
    
    if ocurrencia_id:
        asistentes = [a for a in asistentes if a.get('ocurrencia_id') == ocurrencia_id]
    else:
        # Por defecto, solo devolvemos los de la sesión principal
        asistentes = [a for a in asistentes if not a.get('ocurrencia_id')]
        
    return asistentes

@router.get("/{sesion_id}/qr")
async def obtener_qr_sesion(sesion_id: str):
    """
    Genera y devuelve el código QR de la sesión dinámicamente
    """
    from fastapi.responses import Response
    
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    
    qr_bytes = sesion_service.generar_qr_dinamico(sesion['link'])
    
    return Response(
        content=qr_bytes,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": f"inline; filename=qr_{sesion_id}.png",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*"
        }
    )

@router.get("/{sesion_id}/ocurrencias/{ocurrencia_id}/qr")
async def obtener_qr_ocurrencia(sesion_id: str, ocurrencia_id: str):
    """
    Genera y devuelve el código QR de una ocurrencia específica
    """
    from fastapi.responses import Response
    
    sesion = sesion_service.get_sesion_by_id(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    
    ocurrencia = next((oc for oc in sesion.get('ocurrencias', []) if oc['id'] == ocurrencia_id), None)
    if not ocurrencia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ocurrencia no encontrada")
    
    qr_bytes = sesion_service.generar_qr_dinamico(ocurrencia['link'])
    
    return Response(
        content=qr_bytes,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": f"inline; filename=qr_{ocurrencia_id}.png",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*"
        }
    )
