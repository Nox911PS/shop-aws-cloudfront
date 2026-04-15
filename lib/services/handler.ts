export async function main(event) {
  return { message: `Hello from Lambda  NOX🎉', ${event.message}` };
}
