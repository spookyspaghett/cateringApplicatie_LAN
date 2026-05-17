import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useRegisterAttendee } from '../hooks/useAttendees'
import { ErrorMessage } from '../components/ErrorMessage'

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free',
  'Nut-free', 'Halal', 'Kosher',
]

const passwordSchema = z.string()
  .min(8,            'At least 8 characters')
  .regex(/[A-Z]/,    'Must contain an uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character (e.g. !@#$%)')

const schema = z.object({
  name:                 z.string().min(2, 'Name must be at least 2 characters'),
  email:                z.string().email('Enter a valid email'),
  password:             passwordSchema,
  confirm_password:     z.string(),
  dietary_restrictions: z.array(z.string()),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path:    ['confirm_password'],
})

type FormValues = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useRegisterAttendee()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { dietary_restrictions: [] },
  })

  async function onSubmit(values: FormValues) {
    try {
      // Don't send confirm_password to the server
      const { confirm_password, ...payload } = values
      const attendee = await mutateAsync(payload) as { id: string }
      navigate(`/menu?attendee=${attendee.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (msg.toLowerCase().includes('already registered')) {
        setError('root', { message: '§ALREADY_REGISTERED§' })
      } else {
        setError('root', { message: msg })
      }
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Register for the LAN</h1>
      <p className="text-gray-400 mb-8">
        Sign up to grab your spot and pre-order your food.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-col gap-5">
        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="Ada Lovelace" {...register('name')} />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="ada@example.com" {...register('email')} />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 chars, 1 uppercase, 1 special"
            {...register('password')}
          />
          {errors.password
            ? <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            : <p className="text-gray-500 text-xs mt-1">
                At least 8 characters, one uppercase letter, one special character.
              </p>
          }
        </div>

        <div>
          <label className="label">Confirm password</label>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            {...register('confirm_password')}
          />
          {errors.confirm_password && (
            <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        <div>
          <label className="label">Dietary restrictions (optional)</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {DIETARY_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.toLowerCase()}
                  {...register('dietary_restrictions')}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-brand-500 focus:ring-brand-500"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {errors.root && (
          errors.root.message === '§ALREADY_REGISTERED§' ? (
            <div className="rounded-lg border border-yellow-800 bg-yellow-950 px-4 py-3 text-sm text-yellow-300">
              That email is already registered.{' '}
              <Link to="/login" className="underline font-medium hover:text-yellow-100">
                Log in instead →
              </Link>
            </div>
          ) : (
            <ErrorMessage message={errors.root.message!} />
          )
        )}

        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Registering…' : 'Register & choose food →'}
        </button>
      </form>
    </div>
  )
}
