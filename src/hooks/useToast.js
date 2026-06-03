import { useDispatch } from 'react-redux'
import { addToast, removeToast } from '../store/slices/uiSlice'

export const useToast = () => {
  const dispatch = useDispatch()
  const toast = ({ title, description, variant = 'default', duration = 4000 }) => {
    const id = Date.now()
    dispatch(addToast({ id, title, description, variant }))
    setTimeout(() => dispatch(removeToast(id)), duration)
  }
  return { toast }
}
