import { Loader2 } from 'lucide-react';

export default function Button({ children, isLoading, onClick, disabled, className }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        relative flex items-center justify-center
        bg-green-500 hover:bg-green-400 text-black 
        font-bold py-4 px-8 rounded-lg 
        transition-all duration-200 transform active:scale-95
        disabled:opacity-70 disabled:cursor-not-allowed
        shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.6)]
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Processando...
        </>
      ) : (
        children
      )}
    </button>
  );
}