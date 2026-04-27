// Invoice & receipt scanner
// Uses Claude's vision to extract financial data from photos/PDFs

const ANTHROPIC_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

const ATO_CATEGORIES = [
  'D1 – Repairs and maintenance',
  'D2 – Capital improvement (depreciate)',
  'D3 – Motor vehicle expenses',
  'D4 – Animal purchases',
  'D5 – Feed and fodder',
  'D6 – Veterinary and chemicals',
  'D7 – Seeds and plants',
  'D8 – Fencing and water',
  'D9 – Fuel and oil',
  'D10 – Wages and labour',
  'D11 – Insurance',
  'D12 – Rates and land tax',
  'D13 – Interest on loans',
  'D14 – Accounting and legal',
  'D15 – Subscriptions and memberships',
  'D16 – Marketing and advertising',
  'D17 – Other deductible expense',
  'D18 – Non-deductible expense',
  'I1 – Primary production sales',
  'I2 – Livestock sales',
  'I3 – Crop and produce sales',
  'I4 – Honey and bee product sales',
  'I5 – Other farm income',
  'I6 – Government grants / rebates',
];

const ENTERPRISES = [
  'Farm-wide / general',
  'Table olives — cured', 'Table olives — oil', 'Olive leaf tea / extract',
  'Free-range eggs',
  'Honey — European bees', 'Honey — native bees',
  'Industrial hemp — seed/fibre',
  'Aquaponics — jade perch', 'Aquaponics — produce',
  'Nasturtium — edible flowers', 'Finger lime', 'Vanilla', 'Wasabi',
  'Ginger', 'Turmeric', 'Galangal',
  'Makrut lime leaves', 'Lemongrass', 'Asian herbs',
  'Specialty chillies', 'Garlic', 'Sweet potato',
  'Macadamia nuts', 'Macadamia — propagation / grafting',
  'Bananas', 'Mango', 'Avocado', 'Feijoa', 'Passionfruit', 'Strawberries',
  'Davidson plum', 'Lemon myrtle', 'Coffee', 'Cacao',
  'Edible flowers (mixed)', 'BSFL — larvae / frass',
  'Goats', 'Waterfowl / geese',
  'Machinery & equipment', 'Infrastructure & fencing', 'Water & irrigation',
  'General farm — not allocated',
];

// Convert file to base64
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Main scanner — accepts File object (image or PDF)
export const scanInvoice = async (file) => {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not set. Add REACT_APP_ANTHROPIC_API_KEY to your .env.local file.');
  }

  const base64 = await fileToBase64(file);
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  if (!isImage && !isPdf) {
    throw new Error('Please upload an image (JPG, PNG) or PDF file.');
  }

  const mediaType = isPdf ? 'application/pdf' : file.type;

  const prompt = `You are a farm bookkeeping assistant for an Australian farm. Analyse this receipt or invoice and extract all financial information.

Return ONLY a valid JSON object with these exact fields (use null for anything not found):
{
  "supplier_name": "string — business name",
  "supplier_abn": "string — ABN if shown, formatted as XX XXX XXX XXX",
  "invoice_number": "string — invoice or receipt number",
  "invoice_date": "string — date in YYYY-MM-DD format",
  "total_amount": number — total amount paid including GST,
  "gst_amount": number — GST component (if total is GST inclusive, this is total/11),
  "ex_gst_amount": number — amount excluding GST,
  "gst_status": "one of: GST inclusive (10%) | GST free | No GST — not registered | Input taxed",
  "ato_category": "most likely ATO category from this list: ${ATO_CATEGORIES.join(', ')}",
  "enterprise": "most likely enterprise from this list: ${ENTERPRISES.join(', ')}",
  "description": "string — brief description of what was purchased",
  "payment_method": "one of: Bank transfer | Card — business | Card — personal (claim back) | Cash | Direct debit | Other",
  "bas_quarter": "one of: Q1 — Jul to Sep | Q2 — Oct to Dec | Q3 — Jan to Mar | Q4 — Apr to Jun — based on the invoice date",
  "type": "Expense or Income",
  "confidence": "high | medium | low — how confident you are in the extraction",
  "notes": "string — any relevant notes, warnings, or things the farmer should check"
}

For bas_quarter: Jul-Sep = Q1, Oct-Dec = Q2, Jan-Mar = Q3, Apr-Jun = Q4.
For gst_amount: if total is GST inclusive, calculate as total_amount / 11 (rounded to 2 decimal places).
For ato_category: use context clues — if it's a vet invoice use D6, feed supplier use D5, hardware/fencing use D8, fuel use D9, etc.
Be conservative — if unsure about GST status, flag it in notes.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: isPdf ? 'document' : 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content.map(b => b.text || '').join('');

  // Strip markdown fences if present
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const extracted = JSON.parse(clean);
    return extracted;
  } catch (e) {
    throw new Error('Could not parse the extracted data. The image may be unclear — try a better photo.');
  }
};

// Generate current quarter string
export const getCurrentBASQuarter = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 7 && month <= 9) return 'Q1 — Jul to Sep';
  if (month >= 10 && month <= 12) return 'Q2 — Oct to Dec';
  if (month >= 1 && month <= 3) return 'Q3 — Jan to Mar';
  return 'Q4 — Apr to Jun';
};
